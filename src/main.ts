import {debug, getInput, setFailed, setOutput} from "@actions/core"
import {exec} from "@actions/exec"
import {downloadTool, extractZip, cacheDir, cacheFile, find as findCache} from "@actions/tool-cache"
import {createHash} from "crypto"
import {createReadStream, promises as fs} from "fs"
import * as https from "https"
import * as os from "os"
import {join} from "path"
import * as semverCmp from "semver-compare"

async function getJson(url: string, opts: https.RequestOptions = {}) : Promise<any> {
	return new Promise((resolve, reject) => {
		https.get(url, opts, res => {
			let data = ""
			res.setEncoding("utf8")
			res.on("data", chunk => {
				data += chunk
			})
			res.on("end", () => resolve(JSON.parse(data)))
		}).on("error", e => reject)
	})
}

async function downloadBuildScripts(ref: string) : Promise<[string, string]> {
	const zipball = await downloadTool(`https://github.com/pmmp/php-build-scripts/archive/${ref}.zip`)
	const hash = createHash("md5")
	const hex = await new Promise((resolve, reject) => {
		const reader = createReadStream(zipball)
		reader.on("readable", () => {
			const data = reader.read()
			if(data) {
				hash.update(data)
			} else {
				resolve(hash.digest("hex"))
			}
		})
	}) as string
	const target = await extractZip(zipball)
	return [join(target, `php-build-scripts-${ref}`), hex]
}

async function installWindows(buildScripts: string, phpVerMd5: string) : Promise<string> {
	await exec("cmd.exe", ["./windows-compile-vs.bat"], {
		cwd: buildScripts,
		env: {
			VS_EDITION: "Enterprise",
		},
		input: Buffer.alloc(0),
	})
	await cacheDir(join(buildScripts, "bin"), "pmphp", phpVerMd5, os.type())
	return join(buildScripts, "bin", "php", "php.exe")
}

async function installDarwin(buildScripts: string, phpVerMd5: string) : Promise<string> {
	await exec("brew", ["install", "automake", "bison", "re2c", "libtool", "libtool"])
	await fs.chmod(join(buildScripts, "compile.sh"), 0o775)
	await exec("./compile.sh", ["-t", "mac64", "-j4", "-f", "-u", "-g", "-l"], {
		cwd: buildScripts,
		input: Buffer.alloc(0),
	})
	await cacheDir(join(buildScripts, "bin"), "pmphp", phpVerMd5, os.type())
	return join(buildScripts, "bin", "php7", "bin", "php")
}

async function installLinux(buildScripts: string, phpVerMd5: string) : Promise<string> {
	await exec("sudo", ["apt-get", "install", "-y", "automake", "bison", "re2c", "libtool", "libtool-bin"])
	await fs.chmod(join(buildScripts, "compile.sh"), 0o775)
	await exec("./compile.sh", ["-t", "linux64", "-j4", "-f", "-u", "-g", "-l"], {
		cwd: buildScripts,
		input: Buffer.alloc(0),
	})
	await cacheDir(join(buildScripts, "bin"), "pmphp", phpVerMd5, os.type())
	return join(buildScripts, "bin", "php7", "bin", "php")
}

interface Version {
	ref: string
	source: boolean
	phpBranch: string
}

async function parseVersion(target: string) : Promise<Version> {
	if(target.match(/^\d+\.\d+\.\d+/)) {
		return {
			ref: target,
			source: false,
			phpBranch: "stable",
		}
	}

	if(target === "stable") {
		const ret = await getJson("https://poggit.pmmp.io/pmapis")
		const apis: string[] = []
		for(const api in ret) {
			apis.push(api)
		}
		apis.sort(semverCmp)
		debug(`APIs available: ${apis.join(", ")}`)
		const version = apis[apis.length - 1]

		return {
			ref: version,
			source: false,
			phpBranch: "stable",
		}
	}

	if(target === "minor.next") {
		return {
			ref: "stable",
			source: true,
			phpBranch: "stable",
		}
	}

	if(target === "major.next") {
		return {
			ref: "master",
			source: true,
			phpBranch: "master",
		}
	}

	throw `Invalid version target ${target}`
}

;(async () => {
	const version = await parseVersion(getInput("target") || "stable")
	debug(`Using target version ${version.ref} @ ${version.phpBranch}`)

	const [buildScripts, phpVerMd5] = await downloadBuildScripts(version.phpBranch)

	let phpPath = findCache("pmphp", phpVerMd5, os.type())
	if(phpPath === "") {
		switch(os.type()) {
			case "Windows_NT":
				phpPath = await installWindows(buildScripts, phpVerMd5)
				break
			case "Darwin":
				phpPath = await installDarwin(buildScripts, phpVerMd5)
				break
			case "Linux":
				phpPath = await installLinux(buildScripts, phpVerMd5)
				break
			default:
				throw `Unknown OS ${os.type()}`
		}
	} else {
		phpPath = join(phpPath, "php7", "bin", "php")
	}

	setOutput("php", phpPath)

	let phar = findCache("PocketMine-MP.phar", version.ref)
	if(phar === "") {
		if(version.source) {
			// TODO build from source
			throw "Building from source is not implemented yet"
		} else {
			phar = await downloadTool(`https://github.com/pmmp/PocketMine-MP/releases/download/${version.ref}/PocketMine-MP.phar`)
		}
		await cacheFile(phar, "PocketMine-MP.phar", "PocketMine-MP.phar", version.ref)
	} else {
		phar = join(phar, "PocketMine-MP.phar")
	}

	setOutput("pm", phar)
})().catch(setFailed)
