import {IPlugin,Context} from './Plugin';
// import {PlugUtils} from "./PlugUtils";
import {Utils} from '../Utils';
import {Router} from "./basic/Router";
import {Value} from "./basic/Value";
import {Reference} from "./basic/Reference";
import {Defination} from "./basic/Defination";
import {Expression} from "./basic/Expression";
import {Operate} from "./basic/Operate";

const JUMP = "jump";
const END = "_end";
/**
 * Created by jackyanjiaqi on 16/11/5.
 */
export class PluginRegisterManager{
    reverse = {};
    syntaxTree = {};
    testers = {};
    createFuncs = {};
    static singleInstance;

    constructor(){
        new Expression().register(this);
        new Operate().register(this);
        new Defination().register(this);
        new Value().register(this);
        new Reference().register(this);
        // new Iterator().register(this);
        // new Loader().register(this);
        // new Condition().register(this);
        // new Loop().register(this);
        // this.print();
    }

    public static get(){
        if(!PluginRegisterManager.singleInstance){
            PluginRegisterManager.singleInstance = new PluginRegisterManager();
        }
        return PluginRegisterManager.singleInstance;
    }

    public register(name:string,createFunc:Function,tester:Object,grammerTree:Object){
        if(grammerTree){
            this.syntaxTree[name] = grammerTree;
            if("reverse" in grammerTree){
                this.reverse[name] = grammerTree["reverse"];
            }
        }
        if(tester){
            this.testers[name] = tester;
        }
        if(createFunc){
            this.createFuncs[name] = createFunc;
        }
    }

    public test(nojson_script:string,testType?:string,syntaxStack?:any[],isTop:boolean = false):any{
        //默认解析表达式
        if(!testType)testType = "Expression";
        if(!syntaxStack)syntaxStack = [];
        console.log(nojson_script,testType,syntaxStack);
        if(nojson_script && nojson_script!=""){
            // let plug:IPlugin = this.createFuncs[testType]();
            //顶层路径
            let path = '';
            //有语法树 先执行语法树
            if(testType in this.syntaxTree) {
                let topSyntax = this.syntaxTree[testType];
                let SyntaxTree = topSyntax;
                for(let i=0;i<nojson_script.length;){
                    //补完语法树
                    if(JUMP in SyntaxTree){
                        //从path获得上一层的引用
                        let domainA = topSyntax;
                        let pathA = path;
                        // console.log("jump",JSON.stringify(SyntaxTree));
                        let domainB = Value.value(this.syntaxTree,SyntaxTree[JUMP]);
                        Router.mixBtoA(domainA,pathA,Utils.copyStringifyData(domainB),"");
                    }
                    let singleChar = nojson_script.charAt(i);
                    console.log("index:",i,"char",singleChar);
                    if(singleChar == ",")console.log(JSON.stringify(SyntaxTree));
                    //查单字符
                    if(singleChar in SyntaxTree){
                        path = "" == path?
                            singleChar :
                            path + "/" + singleChar;
                        syntaxStack.push(singleChar);
                        // if(singleChar == "("||
                        //     singleChar == ","){
                        //     console.log(singleChar);
                        // }
                        SyntaxTree = SyntaxTree[singleChar];
                        i++;
                        continue;
                    }
                    //类型过滤器
                    let filterTypeName = (key)=>{
                        if(key in this.syntaxTree ||
                                key in this.testers ||
                                    key.indexOf('.') >= 0
                        )return true;
                        return false;
                    };
                    //查类型
                    let typeNames = Object.keys(SyntaxTree).filter(filterTypeName);
                    //没有其他类型了
                    if(typeNames.length == 0){
                        //没有其他路可走 且可以结束
                        if(END in SyntaxTree){
                            return {data:syntaxStack,index:i - 1,end:SyntaxTree[END],path:path};
                        //无路可走且无法结束
                        }else{
                            console.log(`${nojson_script} ${testType} end syntaxTree no end1`);
                            break;
                            // return null;
                        }
                    }else{
                        //有其他类型
                        let isTypeFit = false;
                        for(let typeName of typeNames){
                            //从当前index截取子串用于匹配
                            let sub_nojson_script = nojson_script.substring(i);
                            let syntaxStackWrapper = {match:typeName,syntax:[]};
                            let res = new PluginRegisterManager().test(sub_nojson_script,typeName,syntaxStackWrapper.syntax);
                            if(isTop)console.log(JSON.stringify(res));
                            if(res != null){
                                syntaxStackWrapper["end"] = res["end"];
                                syntaxStack.push(syntaxStackWrapper);
                                i = i + res.index + 1;
                                SyntaxTree = SyntaxTree[typeName];
                                if(isTop)console.log(JSON.stringify(SyntaxTree));
                                // console.log(SyntaxTree);
                                path = "" == path?
                                    typeName :
                                    path + "/" + typeName;
                                isTypeFit = true;
                                break;
                            }
                        }

                        //其他类型都不匹配
                        if(!isTypeFit){
                            // console.log(`${path},typeFit`);
                            //可以结束
                            if(END in SyntaxTree){
                                return {data:syntaxStack,index:i - 1,end:SyntaxTree[END],path:path};
                            }else{
                            //语法错误 无法结束
                                console.log(`${nojson_script} ${testType} end syntaxTree no Typefit`);
                                break;
                            //     return null;
                            }
                        }else{
                            // console.log("i",i);
                            continue;
                        }
                    }
                    // i++;
                }
                //可以结束
                if(END in SyntaxTree){
                    return {data:syntaxStack,index:nojson_script.length-1,end:SyntaxTree[END],path:path};
                }else{
                    //语法错误 无法结束
                    // return null;
                    console.log(`${nojson_script} ${testType} end syntaxTree no end 2`);
                }
            }
            //再执行正则检查
            let res = Reference.reference(testType,this.testers);
            // console.log("正则检查",testType,res);
            if(res && res.length > 0){
                let testings = [];
                if("data" in res[0].data){
                    testings.push(res[0].data.data);
                }else{
                    //获得所有子项的data值
                    let ret = Reference.reference(testType+"..'data'",this.testers);
                    testings = ret.map(retItem=>{
                        return retItem.data;
                    })
                }
                // console.log("testings:",testings);
                let endIndex = -1;
                let isRegFit =
                    testings.some(regexp=>{
                        let reg:RegExp = new RegExp(regexp,"g");
                        let res = reg.exec(nojson_script);
                        //从左向右第一个匹配的值且为头位置
                        if(res && res.index == 0){
                            endIndex = res[0].length - 1;
                            return true;
                        }
                        // console.log(res.length);
                        // console.log(res);
                        // //从末位检查到首位
                        // for(let j=nojson_script.length;j>0;j--){
                        //     let target = nojson_script.substring(0,j);
                        //     console.log("target",target);
                        //     if(target.search(reg) != 0){
                        //         console.log("true");
                        //         endIndex = j;
                        //         return true;
                        //     }
                        // }
                        return false;
                    });

                if(isRegFit){
                    // console.log("reg fit:%d",endIndex);
                    syntaxStack.push(testType);
                    return {data:syntaxStack,index:endIndex,end:"RegExp"};
                }else{
                    console.log(`${nojson_script} ${testType} end 2`);
                    return null;
                }
            }
        }
        console.log(`${nojson_script} ${testType} end 1`);
        return null;
    }

    public testReverse(nojson_script:string,testType?:string,syntaxStack?:any[],isTop:boolean = false):any{
        //默认解析表达式
        if(!testType)testType = "OperateArithmetic";
        if(!syntaxStack)syntaxStack = [];
        console.log(nojson_script,testType,syntaxStack);
        if(nojson_script && nojson_script!=""){
            // let plug:IPlugin = this.createFuncs[testType]();
            //顶层路径
            let path = '';
            //有语法树 先执行语法树
            if(testType in this.syntaxTree) {
                let topSyntax = this.syntaxTree[testType];
                let SyntaxTree = topSyntax;
                let i=nojson_script.length - 1;
                for(;i>=0;){
                    //补完语法树
                    if(JUMP in SyntaxTree){
                        //从path获得上一层的引用
                        let domainA = topSyntax;
                        let pathA = path;
                        // console.log("jump",JSON.stringify(SyntaxTree));
                        let domainB = Value.value(this.syntaxTree,SyntaxTree[JUMP]);
                        Router.mixBtoA(domainA,pathA,Utils.copyStringifyData(domainB),"");
                    }
                    let singleChar = nojson_script.charAt(i);
                    console.log("index:",i,"char",singleChar);
                    //查单字符
                    if(singleChar in SyntaxTree){
                        path = "" == path?
                            singleChar :
                        path + "/" + singleChar;
                        syntaxStack.push(singleChar);
                        // if(singleChar == "("||
                        //     singleChar == ","){
                        //     console.log(singleChar);
                        // }
                        SyntaxTree = SyntaxTree[singleChar];
                        i--;
                        continue;
                    }
                    //类型过滤器
                    let filterTypeName = (key)=>{
                        if(key in this.syntaxTree ||
                            key in this.testers ||
                            key.indexOf('.') >= 0
                        )return true;
                        return false;
                    };
                    //查类型
                    let typeNames = Object.keys(SyntaxTree).filter(filterTypeName);
                    //没有其他类型了
                    if(typeNames.length == 0){
                        //没有其他路可走 且可以结束
                        if(END in SyntaxTree){
                            return {data:syntaxStack,index:i + 1,end:SyntaxTree[END],path:path};
                            //无路可走且无法结束
                        }else{
                            console.log(`${nojson_script} ${testType} end syntaxTree no end1`);
                            break;
                            // return null;
                        }
                    }else{
                        //有其他类型
                        let isTypeFit = false;
                        for(let typeName of typeNames){
                            //从当前index截取子串用于匹配
                            let sub_nojson_script = nojson_script.substring(0,i + 1);
                            let syntaxStackWrapper = {match:typeName,syntax:[]};
                            let res = new PluginRegisterManager().testReverse(sub_nojson_script,typeName,syntaxStackWrapper.syntax);
                            if(isTop)console.log(JSON.stringify(res));
                            if(res != null){
                                syntaxStackWrapper["end"] = res["end"];
                                syntaxStack.push(syntaxStackWrapper);
                                // if(i - res.index - 1 == 8){
                                //     console.log("i:",i,"\nindex:",res.index);
                                // }
                                i = res.index - 1;
                                SyntaxTree = SyntaxTree[typeName];
                                if(isTop)console.log(JSON.stringify(SyntaxTree));
                                // console.log(SyntaxTree);
                                path = "" == path?
                                    typeName :
                                path + "/" + typeName;
                                isTypeFit = true;
                                break;
                            }
                        }

                        //其他类型都不匹配
                        if(!isTypeFit){
                            // console.log(`${path},typeFit`);
                            //可以结束
                            if(END in SyntaxTree){
                                return {data:syntaxStack,index:i + 1,end:SyntaxTree[END],path:path};
                            }else{
                                //语法错误 无法结束
                                console.log(`${nojson_script} ${testType} end syntaxTree no Typefit`);
                                break;
                                //     return null;
                            }
                        }else{
                            // console.log("i",i);
                            continue;
                        }
                    }
                    // i--;
                }
                //可以结束
                if(END in SyntaxTree){
                    return {data:syntaxStack,index:i,end:SyntaxTree[END],path:path};
                }else{
                    //语法错误 无法结束
                    // return null;
                    console.log(`${nojson_script} ${testType} end syntaxTree no end 2`);
                }
            }
            //再执行正则检查
            let res = Reference.reference(testType,this.testers);
            // console.log("正则检查",testType,res);
            if(res && res.length > 0){
                let testings = [];
                if("data" in res[0].data){
                    testings.push(res[0].data.data);
                }else{
                    //获得所有子项的data值
                    let ret = Reference.reference(testType+"..'data'",this.testers);
                    testings = ret.map(retItem=>{
                        return retItem.data;
                    })
                }
                // console.log("testings:",testings);
                let endIndex = -1;
                let isRegFit =
                    testings.some(regexp=>{
                        let reg:RegExp = new RegExp(regexp,"g");
                        let res;
                        //从右向左第一个匹配的值,且紧靠尾部
                        while((res = reg.exec(nojson_script))!=null){
                            if(res.index + res[0].length == nojson_script.length){
                                endIndex = res.index;
                                console.log("test in ,",nojson_script,res[0],endIndex);
                                return true;
                            }
                        }
                        // console.log(res.length);
                        // console.log(res);
                        // //从末位检查到首位
                        // for(let j=nojson_script.length;j>0;j--){
                        //     let target = nojson_script.substring(0,j);
                        //     console.log("target",target);
                        //     if(target.search(reg) != 0){
                        //         console.log("true");
                        //         endIndex = j;
                        //         return true;
                        //     }
                        // }
                        return false;
                    });

                if(isRegFit){
                    // console.log("reg fit:%d",endIndex);
                    syntaxStack.push(testType);
                    return {data:syntaxStack,index:endIndex,end:"RegExp"};
                }else{
                    console.log(`${nojson_script} ${testType} end 2`);
                    return null;
                }
            }
        }
        console.log(`${nojson_script} ${testType} end 1`);
        return null;
    }

    public print(){
        console.log(
            JSON.stringify(this.syntaxTree),
            "\n",
            JSON.stringify(this.testers)
        );
    }
}