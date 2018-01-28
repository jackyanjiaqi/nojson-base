import nojson from "../index";

let Def1 = "?a1";//do1
let Exp1 = "a2='2',?b(a2=a1,?b3=a1.b)";
let Exp2 = "a2='2'";
let Opr1 = "a2='2'",Ref1="a2",Val1="2";//do2
let Exp3 = "?b(a2=a1,?b3=a1.b)";
let Def2 = "?b";//do3
let Exp4 = "a2=a1,?b3=a1.b";
let Exp5 = "a2=a1";
let Opr2 = "a2=a1",Ref2 = "a2",Ref3="a1";//do4
let Exp6 = "?b3=a1.b";
let Def3 = "?b3=a1.b",Ref4="b3",Ref5="a1.b";//do5

let res = nojson.test("a2='2',?b(a2=a1,?b3=a1.b)","Expression",null,false);
// PluginRegisterManager.get().print();
console.log("result",JSON.stringify(res,null,4));