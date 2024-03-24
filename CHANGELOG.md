# Changelog

## [2.0.2](https://github.com/Sleavely/dynamo-plus/compare/v2.0.1...v2.0.2) (2024-03-24)


### Build System

* dont mark package as ESM when its CJS ([c193d86](https://github.com/Sleavely/dynamo-plus/commit/c193d86f7a970994376e24dcefa76750806b6916))

## [2.0.1](https://github.com/Sleavely/dynamo-plus/compare/v2.0.0...v2.0.1) (2024-03-20)


### Bug Fixes

* **ts:** mark return type as void ([9acc034](https://github.com/Sleavely/dynamo-plus/commit/9acc03467e330830518e78a19779fc0042286358))

## [2.0.0](https://github.com/Sleavely/dynamo-plus/compare/v1.8.0...v2.0.0) (2024-03-20)


### ⚠ BREAKING CHANGES

* convert DynamoPlus to typescript as a class
* replace dependencies with aws-sdk v3, ts, vitest, @sleavely/eslint-config

### Features

* parallelScanSegments ([4bc13b4](https://github.com/Sleavely/dynamo-plus/commit/4bc13b469764283cf60a52c075177b9e5b4f80bd))


### Bug Fixes

* expose `delete()` correctly. add test for it. ([f09f799](https://github.com/Sleavely/dynamo-plus/commit/f09f799738bf1af8dcbb61108fe7ab9ab13304e8))
* in scanAll, use paginateScan instead of paginateQuery ([7c6d64c](https://github.com/Sleavely/dynamo-plus/commit/7c6d64cb3a9deeeed1a5574da1149ad88dad58a2))
* remove pageSize from *All() methods since it has no bearing on output ([85b3240](https://github.com/Sleavely/dynamo-plus/commit/85b3240342dbf89308813ccd10b493acc3f694a5))
* reset error stack on *All() calls ([f249c50](https://github.com/Sleavely/dynamo-plus/commit/f249c50a1a0eea5af8d2e5f2229b49af342a39a9))


### Code Refactoring

* convert DynamoPlus to typescript as a class ([8b5d417](https://github.com/Sleavely/dynamo-plus/commit/8b5d4176bd4e10f39a874aaa7d88ec3ca9ac478f))
* replace dependencies with aws-sdk v3, ts, vitest, @sleavely/eslint-config ([b4f6d5b](https://github.com/Sleavely/dynamo-plus/commit/b4f6d5bcc2656cb7cd0a17710e95da2bfdd6c4a9))
