/**
 * Created by jackyanjiaqi on 16/11/6.
 */
import { IPlugin, Context } from '../Plugin';
import { PluginRegisterManager } from '../PluginRegisterManager';

export class Defination implements IPlugin {
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

    constructor() {
        this.type = "?";
    }

    /*处理器范式*/
    process(context:Context, ...args):boolean {
        return true;
    }

    register(manager:PluginRegisterManager) {
        var DefinationTree = require('../../../res/syntax_tree/Defination.json');
        manager.register("Defination",Defination,null,DefinationTree);
    }
}
