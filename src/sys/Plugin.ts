import {PluginRegisterManager} from "./PluginRegisterManager";
import {Router} from './basic/Router';
import {Value} from "./basic/Value";
/**
 * Created by jackyanjiaqi on 16/10/26.
 */
export interface Context{
    domain:Object,
    pointer:string,
    in:any,
    out:any,
    err?:string,
    __temp:Object//存放变量

    //根据变量名获取变量值
    variable(vName:number):any;
    //进入下一层
    cd(dirName:string):boolean;
    //创建下一层
    mkdir(dirName:string):boolean;
    //查找引用
    find(refName:string):any;
    up():boolean;
    key():string;
    value():any;
}

export class SimpleContext implements Context{
    domain:Object;
    pointer:string;
    in:any;
    out:any;
    err:string;
    __temp:Object;//存放变量

    constructor(domain:Object,pointer:string){
        this.domain = domain;
        this.pointer = pointer;
        this.in = null;
        this.out = null;
        this.err = null;
        this.__temp = {};
    }

    variable(vName:number){
        return this.__temp[vName];
    }

    cd(dirName:string):boolean{
        if(this.get(dirName)!=null){
            this.pointer = Router.path_cd(this.pointer,dirName);
            return true;
        }
        return false;
    }

    mkdir(dirName:string):boolean{
        // if()
        return false;
    }


    get(refName:string):any{
        let mother = Value.value(this.domain,this.pointer);
        switch(typeof mother){
            case 'object':
                return mother[refName];
            default:
        }
        return null;
    }

    up():boolean {
        return null;
    }

    key():string {
        return null;
    }

    value():any {
        return null;
    }

    find(refName:string):any {
        return null;
    }
}

export interface IPlugin{
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
    /*处理器范式*/
    process(context:Context,...args):boolean;
    /*注册到PluginRegisterManager上*/
    register?(manager:PluginRegisterManager):void;
}

