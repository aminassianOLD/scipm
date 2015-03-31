
[![npm package version][badge-image-npm-package-version]][badge-url-npm-package-version]
[![npm package count download][badge-image-npm-package-count-download]][badge-url-npm-package-count-download]


![scipm][icon-image64x64] scipm v0.1.3
=================================================

Introduction
------------------------------------------

[SciTE](http://www.scintilla.org/SciTE.html) package manager

Installation
------------------------------------------

scipm is a Node.js module, so you'll need to <a href="https://nodejs.org/">have Node.js installed</a>.  This package is available on [npm](https://www.npmjs.com/package/scipm) as ``scipm``

```bash
$ node --version
$ npm --version
$ npm install -g scipm
$ scipm --version
$ scipm --help
```

Usage
------------------------------------------

> **Warning** : scipm **erase** your current ``SciTEStartup.lua``. Save this file before run scipm !

```
mkdir myscipm
cd myscipm
npm init
npm install scipm.exec --save
npm install scipm.vardump --save
npm install scipm.extman --save

scipm build
# restart SciTE
```




Made by
------------------------------------------

The original author of scipm is  [Alban Minassian](https://github.com/aminassian).

If you like scipm and would like to support it, you are welcome to make a donation. It will surely be appreciated! Thanks!

[![donate with your pledgie account][donate-image-pledgie]][donate-url-pledgie][![donate with your gratipay account][donate-image-gratipay]][donate-url-gratipay]

License
------------------------------------------

[GPL-3.0](https://github.com/aminassian/scipm/blob/master/LICENCE.txt)

Logo : fa-plane from [Font-Awesome](http://fortawesome.github.io/Font-Awesome/) (licence [SIL OFL 1.1](http://scripts.sil.org/OFL))

External libraries :

- [underscore.js](http://underscorejs.org/) ([licence](https://github.com/jashkenas/underscore/blob/master/LICENSE))
- [momentjs](http://momentjs.com/) ([licence](https://github.com/moment/moment/blob/develop/LICENSE))
- [js2lua](https://github.com/Ensequence/js2lua) ([licence](https://github.com/Ensequence/js2lua#license))
- [babel](https://babeljs.io/) ([licence](https://github.com/babel/babel/blob/master/LICENSE))
- [node-dashdash](https://github.com/trentm/node-dashdash) ([licence](https://github.com/trentm/node-dashdash/blob/master/LICENSE.txt))
- [jayschema](https://github.com/natesilva/jayschema) ([licence](https://github.com/natesilva/jayschema/blob/master/LICENSE))
- [node-semver](https://github.com/npm/node-semver) ([licence](https://github.com/arturadib/shelljs/blob/master/LICENSE))
- [winston](https://github.com/winstonjs/winston) ([licence](https://github.com/winstonjs/winston/blob/master/LICENSE))


Links
------------------------------------------

- www : http://aminassian.github.io/scipm
- www [fr] : http://aminassian.github.io/scipm/index.fr.html
- github : https://github.com/aminassian/scipm
- issues : https://github.com/aminassian/scipm/issues
- npm : https://www.npmjs.com/package/scipm
- pledgie : https://pledgie.com/campaigns/28354 [donate]
- gratipay : https://gratipay.com/aminassian [donate]

Release Notes
------------------------------------------

- 0.1.3 (2015/03/31):
    - ``init`` init

------------------------------------------

Copyright © 2015 - Proudly Made In Nantes [![nantestech][nantestech-image]][nantestech-url]
[nantestech-image]: https://raw.githubusercontent.com/aminassian/scipm/master/img/NANTES-TECH-LOGO-NOIR-HOR.png
[nantestech-url]: http://www.nantestech.com

[icon-image32x32]: https://raw.githubusercontent.com/aminassian/scipm/master/img/plane_000000_32.png
[icon-image64x64]: https://raw.githubusercontent.com/aminassian/scipm/master/img/plane_000000_64.png
[donate-image-pledgie]: https://raw.githubusercontent.com/aminassian/scipm/master/img/pledgie32x32.png
[donate-url-pledgie]: https://pledgie.com/campaigns/28354
[donate-image-gratipay]: https://raw.githubusercontent.com/aminassian/scipm/master/img/gratipay32x32.png
[donate-url-gratipay]: https://gratipay.com/aminassian
[badge-image-npm-package-version]: https://img.shields.io/npm/v/scipm.svg?style=flat
[badge-url-npm-package-version]: https://npmjs.org/package/scipm
[badge-image-npm-package-count-download]: https://img.shields.io/npm/dm/scipm.svg?style=flat
[badge-url-npm-package-count-download]: https://npmjs.org/package/scipm


