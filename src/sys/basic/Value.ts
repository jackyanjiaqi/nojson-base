/**
 * Created by jackyanjiaqi on 16/10/29.
 */
import {IPlugin,Context} from '../Plugin';
import {PluginRegisterManager} from '../PluginRegisterManager';
import {Router} from "./Router";

export class Value implements IPlugin {
    /*字符串中代表使用此插件的符号*/
    type:string;
    /*要处理解析的表达式*/
    expression:string;
    /*当前所处的位置*/
    cwd:string;
    /*解析状态*/
    states:any[];
    /*是否在条件式中*/
    inCondition:boolean;
    constructor(){
        this.type = "@val,@num,@arr,@obj,@str";
    }

    /*处理器范式*/
    public process (context:Context,...args):boolean{
        return true;
    }



    static value(domain:Object,path:string):any{
        if(!domain){
            return null;
        }
        if(!path){
            path = "";
        }
        let search_domain = domain;
        if(path != "") {
            let pNames = Router.path_split(path);
            for(let i=0;i<pNames.length;i++){
                let pName = pNames[i];
                if(pName in search_domain){
                    search_domain = search_domain[pName];
                }else{
                    return null;
                }
            }
        }
        return search_domain;
    }

    static reg = {
        "literal":{
            "dynamic":{
                "data" : "\\`[^\\`]+\\`"
            },
            "static":{
                "data" : "\\'[^\\']*\\'"
            }
        },
        "number":{
            "decimal":{
                "data" : "([1-9]\\d*|0)\\.\\d+"
            },
            "integer":{
                "data" : "[1-9]\\d*"
            },
            "zero":{
                "data":"0"
            }
        }
    };
    register(manager:PluginRegisterManager){
        var ValueTree = require('./../../../res/syntax_tree/Value.json');
        var ValueIndexTree = require('./../../../res/syntax_tree/ValueIndex.json');
        var ValueReverseTree = require('./../../../res/syntax_tree/ValueReverse.json');
        var ValueIndexReverseTree = require('./../../../res/syntax_tree/ValueIndexReverse.json');

        manager.register("Value",Value,Value.reg,ValueTree);
        manager.register("ValueIndex",Value,null,ValueIndexTree);
        manager.register("ValueReverse",Value,Value.reg,ValueReverseTree);
        manager.register("ValueIndexReverse",Value,null,ValueIndexReverseTree);
    }
}

