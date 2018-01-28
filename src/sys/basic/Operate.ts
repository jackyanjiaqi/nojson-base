import { IPlugin, Context } from '../Plugin';
import { PluginRegisterManager } from '../PluginRegisterManager';

/**
 * 负责双目运算符的加减乘除四则运算
 * Created by jackyanjiaqi on 16/10/26.
 */
export class Operate implements IPlugin{
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
        /**
         * 符号 名称 用法 含义
         * = 等号 {reference}={reference,expression,value} 赋值操作,把右边的引用,表达式或值赋值给左值
         * @= 定义域变量 @={name} 定义一个名为name的临时变量 相当于let name;
         * @lnk 连接 @lnk / @lnk(value) /@lnk(lnk1,lnk2)一个参数时只接受数组调用其join方法 两个或以上参数时如果是字符串则字符串拼接,如果是数组则数组连接
         * @add 相加 同+用法
         * @mns 相减 同-用法
         *
         * @type {string}
         */
        this.type = "=,@=,@lnk,@add,@mns"
    }

    /*处理器范式*/
    process(context:Context,...args):boolean{
        return true;
    }

    register(manager:PluginRegisterManager){
        var OperateTree = require('../../../res/syntax_tree/Operate.json');

        // //四则运算(实际是五则运算)
        // var OperateArithmeticTree = require('../../../res/syntax_tree/OperateArithmetic.json');
        // var ArithmeticClass0Tree = require('../../../res/syntax_tree/ArithmeticClass0.json');
        // var ArithmeticClass1Tree = require('../../../res/syntax_tree/ArithmeticClass1.json');
        // var ArithmeticClass2Tree = require('../../../res/syntax_tree/ArithmeticClass2.json');

        manager.register("Operate",Operate,null,OperateTree);
        // manager.register("OperateArithmetic",Operate,null,OperateArithmeticTree);
        // manager.register("ArithmeticClass0",Operate,null,ArithmeticClass0Tree);
        // manager.register("ArithmeticClass1",Operate,null,ArithmeticClass1Tree);
        // manager.register("ArithmeticClass2",Operate,null,ArithmeticClass2Tree);
    }
}

