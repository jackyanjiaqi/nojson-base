#NOJSON-BASE Lib

Semantic script runs as some terminology-values while json plain string is parsing.Carrying a mirror part of the server logic code(a huge nojson-script)which supports a small event system to join a independent front-end implementation
________

#Usage

##Converse a no-json Expression into a semantic tree like this.

test/index.js
    
```
    const nojsonbase = require("nojson-base");
    let res = nojsonbase.test("a2='2',?b(a2=a1,?b3=a1.b)", "Expression", null, true);
    console.log("result", JSON.stringify(res, null, 4));
```