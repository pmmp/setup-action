# Action pmmp/setup

GitHub action for setting up the environment for PocketMine.

(Still work in progress)

## How to use
Copy the following to `.github/workflows/pm.yml` in your repository:

```yml
name: PocketMine plugin CI
on:
  push: {}
  pull_request:
    types: [opened, reopened, synchronize]
  release:
    types: [published]
jobs:
  pm:
    name: PocketMine
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
        target: [3.15.0, stable, minor.next, major.next]
    steps:
      - uses: actions/checkout@v2
      - uses: pmmp/setup@v1
        with:
          target: ${{ matrix.target }}
      - uses: pmmp/test@v1
        with:
          target: ${{ matrix.target }}
      - uses: pmmp/pack@v1
        with:
          target: ${{ matrix.target }}
```
