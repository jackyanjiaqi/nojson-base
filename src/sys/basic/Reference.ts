import { IPlugin, Context, SimpleContext } from '../Plugin';
import { Router } from './Router';
import { Value } from './Value';
import { join } from 'path';
import { PluginRegisterManager } from "../PluginRegisterManager";

/**
 * a=b
 * 作为左值返回一个地址
 * 作为右值返回一个值或者地址
 *
 * 引用不改变层级,返回一个值或者引用代替原来的表达式
 * a 在当前层查找a,否则向上查找
 * a.b 在当前层查找a的直接子项b
 * a..b 在当前层查找a的泛子项b
 * a.1 等同于a[1]
 */
export class Reference implements IPlugin {
    /*字符串中代表使用此插件的符号*/
    type:string;
    /*要处理解析的表达式*/
    expression:string;
    /*当前所处的位置*/
    cwd:string = null;
    /*解析状态*/
    states:any[];
    /*是否在条件式中*/
    inCondition:boolean = false;

    static MODE_HAVE = "have";
    static MODE_IS = "is";
    static TYPE_VALUE = "value";
    static TYPE_REFERENCE = "reference";
    reg:RegExp;
    "reg-name":RegExp;


    context:Context;

    mainRef:string = null;//主引用
    childsPath:Reference[] = null;//孩子引用
    mode:string = Reference.MODE_HAVE;//默认是have
    expect:string;
    positionTag:string = null;
    typeTag:string = null;

    constructor(expression?:string) {
        this.type = "@ref";
        this.expression = expression;
    }

    public config(wrapper:Object):Reference {
        if (typeof wrapper == 'object') {
            for (let key of Object.keys(wrapper)) {
                if (key in this) {
                    this[key] = wrapper[key];
                }
            }
        }
        return this;
    }

    /*处理器范式*/
    public process(context:Context, ...args):boolean {
        this.context = context;
        let reg:RegExp = new RegExp(Reference.reg.data,"g");
        let res:RegExpExecArray = reg.exec(this.expression);
        if (!res) {
            context.err = `${this.expression}不是引用`;
            return false;
        }

        this.mainRef = res[1];
        if (Reference.MODE_IS == this.mode &&
            (res.index != 0 ||
            res[0].length != this.expression.length)) {
            //在is模式中只要不是从头开始或者完整结束就不是is语义
            context.err = `${this.expression}不符合is模式下引用的定义`;
            return false;
        }
        let exp:string = this.expression;
        while (
        !(reg.lastIndex = 0) &&
        (res = reg.exec(exp)) != null &&
        // !console.log(res) &&
        res[2] != null &&
        res[2] != undefined) {
            if (!this.childsPath) {
                this.childsPath = [];
            }
            let newPlug;
            if (res[5] != null) {
                //字面量值
                newPlug = new Reference(res[2]).config(
                    {
                        mainRef: res[5],
                        typeTag: Reference.TYPE_VALUE,
                        mode: Reference.MODE_IS,
                        positionTag: res[2].substr(0, res[2].length - res[3].length)
                    }
                );
            } else if (res[4] != null) {
                //引用
                newPlug = new Reference(res[2]).config(
                    {
                        mainRef: res[4],
                        typeTag: Reference.TYPE_REFERENCE,
                        mode: Reference.MODE_IS,
                        positionTag: res[2].substr(0, res[2].length - res[3].length)
                    }
                );
            }
            this.childsPath.push(newPlug);
            exp = exp.substr(0, exp.length - res[2].length);
        }
        // console.log(this.childsPath);
        let rout_visit_res;
        //访问器
        if ((rout_visit_res = Router.visit(this.mainRef, context.domain, context.pointer)) != null) {
            //最外层引用
            // console.log(rout_visit_res.data);
            //rout_visit_res.data;
            //rout_visit_res.path;
            let ret = [{data: rout_visit_res.data, path: rout_visit_res.path}];
            //内层查找
            while (this.childsPath && this.childsPath.length != 0) {
                let task:Reference = this.childsPath.pop();
                //确定查找名
                let findRef;
                if (Reference.TYPE_REFERENCE == task.typeTag &&
                    new Reference(task.mainRef).config({mode: Reference.MODE_IS}).process(context) &&
                    context.out != null) {
                    //找到了引用,继续向下
                    findRef = context.out.data;
                    if (typeof findRef != 'string') {
                        findRef = task.mainRef;
                    }
                    context.out = null;
                } else {
                    findRef = task.mainRef;
                }
                //开始查找
                let temp = [];
                ret = ret.filter(rout_visit_res=> {
                    let rout_find_res:{data:any,path:string}[];
                    if ((rout_find_res = Router.find(findRef, rout_visit_res.data, task.positionTag)).length != 0) {
                        rout_find_res.forEach(item=>item.path = join(rout_visit_res.path, item.path));
                        temp = [...temp, ...rout_find_res];
                        return true;
                    } else {
                        return false;
                    }
                });
                // console.log(temp);
                if (ret.length == 0) {
                    context.err = `当前引用${this.mainRef}下找不到属性${findRef}`;
                    return false;
                } else {
                    ret = temp;
                }
                //  if(ret.some(rout_visit_res=>{
                //          let rout_find_res;
                //          if((rout_find_res = Router.find(findRef,rout_visit_res.data,task.positionTag)).length != 0){
                //
                //              rout_visit_res.data = rout_find_res[0].data;
                //              rout_visit_res.path = join(rout_visit_res.path,rout_find_res[0].path);
                //              return true;
                //          }else{
                //
                //          }
                //      }))
                // else{
                //
                //  }
            }
            context.out = ret;
        } else {
            context.out = null;
            context.err = `当前环境下找不到引用${this.mainRef}`;
            return false;
        }

        return true;
    }

    static reg = {
        "data": "([a-zA-Z\\u4E00-\\u9FA5][\\w\\u4E00-\\u9FA5]*)(\\.{1,2}(([a-zA-Z\\u4E00-\\u9FA5][\\w\\u4E00-\\u9FA5]*|\\d+)|\\'([^\\']+)\\'))*",
        "name": {
            "data": "[a-zA-Z\\u4E00-\\u9FA5][\\w\\u4E00-\\u9FA5]*"
        },
        "exact":{
            "data":"([a-zA-Z\\u4E00-\\u9FA5][\\w\\u4E00-\\u9FA5]*)(\\.(([a-zA-Z\\u4E00-\\u9FA5][\\w\\u4E00-\\u9FA5]*|\\d+)|\\'([^\\']+)\\'))*"
        }
    };

    static reference(expression:string,domain:Object):{data:any,path:string}[]{
        let context = new SimpleContext(domain,"");
        new Reference(expression).config({mode:Reference.MODE_IS}).process(context);
        return context.out;
    }

    register(manager:PluginRegisterManager){
        manager.register("Reference",Reference,Reference.reg,null);
    }
}