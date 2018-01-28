/**
 * 
 * 表达式就是单个
 *      定义 ?a
 *      赋值 2=3a
 *      流程[]()[]()()
 *      处理器程序 ret@it()
 *      
 * 或几个的以下组合
 *      abc 递进
 *      a,b,c 并列
 *
 * 组合形式有 a1b1c1,a2,b3,c4 或 a1(b2,c2(d3e3))
 *      切记 a1b1,a1b2 != a1(b1,b2)
 */
import { IPlugin, Context } from "../Plugin";
import { PluginRegisterManager } from '../PluginRegisterManager';

export class Expression implements IPlugin{
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
    }

    /*处理器范式*/
    process(context:Context,...args):boolean{
        return true;
    }

    register(manager:PluginRegisterManager){
        var ExpressionTree = require('../../../res/syntax_tree/Expression.json');
        var ExpressionSingleTree = require('../../../res/syntax_tree/ExpressionSingle.json');
        manager.register("Expression",Expression,null,ExpressionTree);
        manager.register("ExpressionSingle",Expression,null,ExpressionSingleTree);
    }
}

