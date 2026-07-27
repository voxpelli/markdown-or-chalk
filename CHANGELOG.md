# Changelog

## [0.3.2](https://github.com/voxpelli/markdown-or-chalk/compare/v0.3.1...v0.3.2) (2026-07-27)


### 🩹 Fixes

* publish *.cjs and *.d.cts ([5adeb4f](https://github.com/voxpelli/markdown-or-chalk/commit/5adeb4f1a3f388e23dfa15fa4ab8db3b38b0acdd))


### 📚 Documentation

* simplify new README ([00877ff](https://github.com/voxpelli/markdown-or-chalk/commit/00877ffb6908ad26a5c11aafdbf02c0d9cdc661b))


### 🧹 Chores

* add markdown linting ([#46](https://github.com/voxpelli/markdown-or-chalk/issues/46)) ([81e3b4c](https://github.com/voxpelli/markdown-or-chalk/commit/81e3b4c3ab16a101d5ecfb75d5fe415c479a316e))

## [0.3.1](https://github.com/voxpelli/markdown-or-chalk/compare/v0.3.0...v0.3.1) (2026-07-27)

### 📚 Documentation

* README with new API + migration instructions ([6c51297](https://github.com/voxpelli/markdown-or-chalk/commit/6c51297fdfb627870c4ca21b809eaaf046cc6a60))
* update badges ([1b93dcc](https://github.com/voxpelli/markdown-or-chalk/commit/1b93dccdb944a78e39320e2dd28bb09043d2db11))

### 🧹 Chores

* **deps:** update dependency chalk to v6 ([#43](https://github.com/voxpelli/markdown-or-chalk/issues/43)) ([8eeb76b](https://github.com/voxpelli/markdown-or-chalk/commit/8eeb76b8d287bfeafd422e66d467368c469abfcf))

## [0.3.0](https://github.com/voxpelli/markdown-or-chalk/compare/v0.2.3...v0.3.0) (2026-07-27)

### ⚠ BREAKING CHANGES

* replaced class with `getOutputStyler()`
* refactor #useMarkdown boolean to #mode string enum
* added tests, updated deps, drops Node 20

### 🌟 Features

* add strikethrough() and code() methods, sanitize hyperlink URL ([8f689b4](https://github.com/voxpelli/markdown-or-chalk/commit/8f689b41d36e9d0cdd4a934ee7236c6c5f432a5c))
* expanded ANSI handlers in fromMdast() ([58b73f9](https://github.com/voxpelli/markdown-or-chalk/commit/58b73f9b2ff4e290887c84d2d5488be706691791))
* refactor #useMarkdown boolean to #mode string enum ([891ee1d](https://github.com/voxpelli/markdown-or-chalk/commit/891ee1d521816f6d9568f6fb983a0dd7bb21902e))

### 🩹 Fixes

* a type that ts 7 complains about ([88255b0](https://github.com/voxpelli/markdown-or-chalk/commit/88255b04b8daee293066a58a7bc542748cba09fd))
* block javascript: URIs, escape backticks in code(), add bullets to ANSI list ([5d8bd04](https://github.com/voxpelli/markdown-or-chalk/commit/5d8bd0461b8ed5b0fc2e990b3c64d4a455660fdf))
* clamp header() level to valid 1-6 range ([e09cec0](https://github.com/voxpelli/markdown-or-chalk/commit/e09cec02f3ad1bd6e77d4b619132005e3085f4da))
* harden node.lang in code block ANSI handler ([f3b351d](https://github.com/voxpelli/markdown-or-chalk/commit/f3b351d0d14fa61dc7deb53316cdafe0c60f1022))
* hardened mdast.js ([1d67bee](https://github.com/voxpelli/markdown-or-chalk/commit/1d67beef46623c93e23daad6064869ad3b5eccfc))
* resolve TS2345 circular reference type error with MdastFormat typedef ([3d8f2a5](https://github.com/voxpelli/markdown-or-chalk/commit/3d8f2a5d36a918fb165cbf79f703595b1db86573))
* update package.json description, URLs, and keywords ([fb48df1](https://github.com/voxpelli/markdown-or-chalk/commit/fb48df1c3ec860801dda917134dff0eb6ec0c08a))

### 📚 Documentation

* improved and expanded documentation / README ([a3351cd](https://github.com/voxpelli/markdown-or-chalk/commit/a3351cdd19603644ab4c0769292aee26f96d0039))
* **readme:** add `@voxpelli/pretty-ts-errors-cli` ([79e1f4c](https://github.com/voxpelli/markdown-or-chalk/commit/79e1f4ce87400859fd5aed536f520546b7815ca8))
* **readme:** fix example ([7c0bc1d](https://github.com/voxpelli/markdown-or-chalk/commit/7c0bc1d2343bdd25e4ce519d301865b053e61df1))

### 🧹 Chores

* add ast-grep-rules and fix violations ([d91d712](https://github.com/voxpelli/markdown-or-chalk/commit/d91d712020e110bec4a136af2bccf7a555b8269b))
* added tests, updated deps, drops Node 20 ([13e97f1](https://github.com/voxpelli/markdown-or-chalk/commit/13e97f1ebb7b20436aace987df4bd1d6a1a27168))
* **deps-dev:** bump smol-toml from 1.3.0 to 1.7.1 ([#35](https://github.com/voxpelli/markdown-or-chalk/issues/35)) ([c12e081](https://github.com/voxpelli/markdown-or-chalk/commit/c12e0813d2108edca8fda6510dea572d2a4eb39b))
* **deps:** lock file maintenance ([#22](https://github.com/voxpelli/markdown-or-chalk/issues/22)) ([02d9bd1](https://github.com/voxpelli/markdown-or-chalk/commit/02d9bd146829f88d424cdb70358a64e984266937))
* **deps:** lockfile maintenance ([f0b7d85](https://github.com/voxpelli/markdown-or-chalk/commit/f0b7d852cd2cdfa57893fd6630d4f54cae6d5780))
* **deps:** update dependency npm-run-all2 to v9 ([#38](https://github.com/voxpelli/markdown-or-chalk/issues/38)) ([3de52dd](https://github.com/voxpelli/markdown-or-chalk/commit/3de52ddea91a5fb11f3b37b33afe905a1d234e8d))
* **deps:** update dependency typescript to \~5.6.3 ([#26](https://github.com/voxpelli/markdown-or-chalk/issues/26)) ([8e0d579](https://github.com/voxpelli/markdown-or-chalk/commit/8e0d5793c269095928082f99e032900e0cad5cdd))
* **deps:** update dependency typescript to \~6.0.3 ([#33](https://github.com/voxpelli/markdown-or-chalk/issues/33)) ([557f262](https://github.com/voxpelli/markdown-or-chalk/commit/557f262706e8b7b587935af78a40ccce47b157b3))
* **deps:** update dev dependencies ([e7ee7cd](https://github.com/voxpelli/markdown-or-chalk/commit/e7ee7cd523915d81973b68f59460fad05584ea41))
* **deps:** update test dependencies ([#31](https://github.com/voxpelli/markdown-or-chalk/issues/31)) ([b33e60d](https://github.com/voxpelli/markdown-or-chalk/commit/b33e60d14f4d3fdc1a7f858d1d016ccd164d7533))
* improve + fix tests ([5ca7655](https://github.com/voxpelli/markdown-or-chalk/commit/5ca76557f0c034cbfb40aecf152e552e7a2ada72))
* improve test coverage ([1b2ef93](https://github.com/voxpelli/markdown-or-chalk/commit/1b2ef93645c6f80034a9bdb911c9ecf557c209e3))
* linting autofix ([1d18c7d](https://github.com/voxpelli/markdown-or-chalk/commit/1d18c7dd3b68bfcd8b1a800474c297229de1bbec))
* replaced class with `getOutputStyler()` ([3a1e5a2](https://github.com/voxpelli/markdown-or-chalk/commit/3a1e5a22e37b384e85a96c6b7b5870c2f7117e52))
* update dev dependencies ([f0192df](https://github.com/voxpelli/markdown-or-chalk/commit/f0192dfe22a88052b80400c8927c66c5d52ec5de))

## [0.2.3](https://github.com/voxpelli/markdown-or-chalk/compare/v0.2.2...v0.2.3) (2024-09-12)

### 🌟 Features

* add support for code blocks in CLI output ([593c91d](https://github.com/voxpelli/markdown-or-chalk/commit/593c91d1829fa672085404191a08c9e23e628ac3))

### 🧹 Chores

* **deps:** update dependency husky to ^9.1.6 ([#25](https://github.com/voxpelli/markdown-or-chalk/issues/25)) ([8d46473](https://github.com/voxpelli/markdown-or-chalk/commit/8d46473ff9e1606aca0055912fd56fe5a87ced98))
* **deps:** update dependency knip to ^5.30.1 ([#27](https://github.com/voxpelli/markdown-or-chalk/issues/27)) ([01330ec](https://github.com/voxpelli/markdown-or-chalk/commit/01330ecfa5a9828480e175b4343657667b214ee0))

## [0.2.2](https://github.com/voxpelli/markdown-or-chalk/compare/v0.2.1...v0.2.2) (2024-09-09)

### 🌟 Features

* export `Table` type ([58115e9](https://github.com/voxpelli/markdown-or-chalk/commit/58115e920c664d12444da261c01d39f05ad4432c))

### 🧹 Chores

* **deps:** lockfile maintenance ([f465b02](https://github.com/voxpelli/markdown-or-chalk/commit/f465b02a83f859c53264a41493cf323028365663))
* **deps:** lockfile maintenance ([db84572](https://github.com/voxpelli/markdown-or-chalk/commit/db8457232646fd7ca185abd4aae9c35d15e5444a))
* **deps:** update dev dependencies ([6135250](https://github.com/voxpelli/markdown-or-chalk/commit/6135250c7efeb00d809b82600053e775a3600fae))
* **deps:** update dev dependencies ([5667ccc](https://github.com/voxpelli/markdown-or-chalk/commit/5667ccc1b425ccff5710943a8c8f4f5ff84867f6))
* **deps:** update linting dependencies ([#13](https://github.com/voxpelli/markdown-or-chalk/issues/13)) ([04f6650](https://github.com/voxpelli/markdown-or-chalk/commit/04f6650f8778c0ddd4189b24db9d387284529ba1))
* **deps:** update test dependencies ([#17](https://github.com/voxpelli/markdown-or-chalk/issues/17)) ([392c188](https://github.com/voxpelli/markdown-or-chalk/commit/392c18816419c5f93391b760f23531b6a2dbcf29))
* **deps:** update type dependencies ([#15](https://github.com/voxpelli/markdown-or-chalk/issues/15)) ([3380987](https://github.com/voxpelli/markdown-or-chalk/commit/3380987f7df6119f9cfe29a42ba0198dbc5575ce))

## [0.2.1](https://github.com/voxpelli/markdown-or-chalk/compare/v0.2.0...v0.2.1) (2024-06-25)

### 🧹 Chores

* **deps:** lock file maintenance ([#14](https://github.com/voxpelli/markdown-or-chalk/issues/14)) ([5e95ff1](https://github.com/voxpelli/markdown-or-chalk/commit/5e95ff1fa375d90b4bee807f540e0ae07515f80a))
* **deps:** update dev dependencies ([8b83424](https://github.com/voxpelli/markdown-or-chalk/commit/8b834248bb214851198061cb01e36540de23e1e7))
* **deps:** update to neostandard based linting ([9619ea2](https://github.com/voxpelli/markdown-or-chalk/commit/9619ea2f972816e66dd3890f0bbd29c12ebed2bf))
* **deps:** update type dependencies ([0f31a05](https://github.com/voxpelli/markdown-or-chalk/commit/0f31a05cc79486aea86b57ba8615524e650e4b77))
* update husky related stuff ([093201b](https://github.com/voxpelli/markdown-or-chalk/commit/093201b327b189d6c4e218c0d047d94dfc02bb3c))
