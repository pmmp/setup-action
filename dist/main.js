"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var core_1 = require("@actions/core");
var exec_1 = require("@actions/exec");
var tool_cache_1 = require("@actions/tool-cache");
var crypto_1 = require("crypto");
var fs_1 = require("fs");
var promises_1 = require("fs/promises");
var https = require("https");
var os = require("os");
var path_1 = require("path");
var semverCmp = require("semver-compare");
function getJson(url, opts) {
    if (opts === void 0) { opts = {}; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    https.get(url, opts, function (res) {
                        var data = "";
                        res.setEncoding("utf8");
                        res.on("data", function (chunk) {
                            data += chunk;
                        });
                        res.on("end", function () { return resolve(JSON.parse(data)); });
                    }).on("error", function (e) { return reject; });
                })];
        });
    });
}
function downloadBuildScripts(ref) {
    return __awaiter(this, void 0, void 0, function () {
        var zipball, hash, hex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, tool_cache_1.downloadTool("https://github.com/pmmp/php-build-scripts/archive/" + ref + ".zip")];
                case 1:
                    zipball = _a.sent();
                    hash = crypto_1.createHash("md5");
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var reader = fs_1.createReadStream(zipball);
                            reader.on("readable", function () {
                                var data = reader.read();
                                if (data) {
                                    hash.update(data);
                                }
                                else {
                                    resolve(hash.digest("hex"));
                                }
                            });
                        })];
                case 2:
                    hex = _a.sent();
                    return [4 /*yield*/, tool_cache_1.extractZip(zipball, "../php-build-scripts")];
                case 3:
                    _a.sent();
                    return [2 /*return*/, ["../php-build-scripts/php-build-scripts-master", hex]];
            }
        });
    });
}
function installWindows(buildScripts, phpVerMd5) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exec_1.exec("cmd.exe", ["./windows-compile-vs.bat"], {
                        cwd: buildScripts,
                        env: {
                            VS_EDITION: "Enterprise"
                        }
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, tool_cache_1.cacheDir(path_1.join(buildScripts, "bin"), "pmphp", phpVerMd5, os.type())];
                case 2:
                    _a.sent();
                    return [2 /*return*/, path_1.join(buildScripts, "bin", "php", "php.exe")];
            }
        });
    });
}
function installDarwin(buildScripts, phpVerMd5) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promises_1.chmod(path_1.join(buildScripts, "compile.sh"), 509)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, exec_1.exec("./compile.sh", ["-t", "mac64", "-j4", "-f", "-u", "-g", "-l"], {
                            cwd: buildScripts
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, tool_cache_1.cacheDir(path_1.join(buildScripts, "bin"), "pmphp", phpVerMd5, os.type())];
                case 3:
                    _a.sent();
                    return [2 /*return*/, path_1.join(buildScripts, "bin", "php7", "bin", "php")];
            }
        });
    });
}
function installLinux(buildScripts, phpVerMd5) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promises_1.chmod(path_1.join(buildScripts, "compile.sh"), 509)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, exec_1.exec("./compile.sh", ["-t", "linux64", "-j4", "-f", "-u", "-g", "-l"], {
                            cwd: buildScripts
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, tool_cache_1.cacheDir(path_1.join(buildScripts, "bin"), "pmphp", phpVerMd5, os.type())];
                case 3:
                    _a.sent();
                    return [2 /*return*/, path_1.join(buildScripts, "bin", "php7", "bin", "php")];
            }
        });
    });
}
function parseVersion(target) {
    return __awaiter(this, void 0, void 0, function () {
        var ret, apis, api, version;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (target.match(/^\d+\.\d+\.\d+/)) {
                        return [2 /*return*/, {
                                ref: target,
                                source: false,
                                phpBranch: "stable"
                            }];
                    }
                    if (!(target === "stable")) return [3 /*break*/, 2];
                    return [4 /*yield*/, getJson("https://poggit.pmmp.io/pmapis")];
                case 1:
                    ret = _a.sent();
                    apis = [];
                    for (api in ret.data) {
                        apis.push(api);
                    }
                    apis.sort(semverCmp);
                    version = apis[apis.length - 1];
                    return [2 /*return*/, {
                            ref: version,
                            source: false,
                            phpBranch: "stable"
                        }];
                case 2:
                    if (target === "minor.next") {
                        return [2 /*return*/, {
                                ref: "stable",
                                source: true,
                                phpBranch: "stable"
                            }];
                    }
                    if (target === "major.next") {
                        return [2 /*return*/, {
                                ref: "master",
                                source: true,
                                phpBranch: "master"
                            }];
                    }
                    throw "Invalid version target " + target;
            }
        });
    });
}
;
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var version, _a, buildScripts, phpVerMd5, phpPath, _b, phar;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, parseVersion(core_1.getInput("target"))];
            case 1:
                version = _c.sent();
                return [4 /*yield*/, downloadBuildScripts(version.phpBranch)];
            case 2:
                _a = _c.sent(), buildScripts = _a[0], phpVerMd5 = _a[1];
                phpPath = tool_cache_1.find("pmphp", phpVerMd5, os.type());
                if (!(phpPath === "")) return [3 /*break*/, 11];
                _b = os.type();
                switch (_b) {
                    case "Windows_NT": return [3 /*break*/, 3];
                    case "Darwin": return [3 /*break*/, 5];
                    case "Linux": return [3 /*break*/, 7];
                }
                return [3 /*break*/, 9];
            case 3: return [4 /*yield*/, installWindows(buildScripts, phpVerMd5)];
            case 4:
                phpPath = _c.sent();
                return [3 /*break*/, 10];
            case 5: return [4 /*yield*/, installDarwin(buildScripts, phpVerMd5)];
            case 6:
                phpPath = _c.sent();
                return [3 /*break*/, 10];
            case 7: return [4 /*yield*/, installLinux(buildScripts, phpVerMd5)];
            case 8:
                phpPath = _c.sent();
                return [3 /*break*/, 10];
            case 9: throw "Unknown OS " + os.type();
            case 10: return [3 /*break*/, 12];
            case 11:
                phpPath = path_1.join(phpPath, "php7", "bin", "php");
                _c.label = 12;
            case 12:
                core_1.setOutput("php", phpPath);
                phar = tool_cache_1.find("PocketMine-MP.phar", version.ref);
                if (!(phar === "")) return [3 /*break*/, 17];
                if (!version.source) return [3 /*break*/, 13];
                // TODO build from source
                throw "Building from source is not implemented yet";
            case 13: return [4 /*yield*/, tool_cache_1.downloadTool("https://github.com/pmmp/PocketMine-MP/releases/download/" + version.ref + "/PocketMine-MP.phar")];
            case 14:
                phar = _c.sent();
                _c.label = 15;
            case 15: return [4 /*yield*/, tool_cache_1.cacheFile(phar, "PocketMine-MP.phar", "PocketMine-MP.phar", version.ref)];
            case 16:
                _c.sent();
                return [3 /*break*/, 18];
            case 17:
                phar = path_1.join(phar, "PocketMine-MP.phar");
                _c.label = 18;
            case 18:
                core_1.setOutput("pm", phar);
                return [2 /*return*/];
        }
    });
}); })()["catch"](core_1.setFailed);
