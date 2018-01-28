/**
 * Created by jackyanjiaqi on 16/10/26.
 */
import { IPlugin, Context } from '../Plugin';
import { Value } from './Value';
import { Utils } from "../../Utils";
var PATH = require('path');

/**
 * 以.或@cd开头用于定位
 * .定位到当前层级,并约束只在当前层级查找
 *      例: .a 仅在当前层查找a,不向上查找
 * ..向上一层
 *      例:
 *          @have-it(value)[value==..value.length]
 *          有值和长度相同
 * ..0顶层
 * ..2向上两层
 * .=1向下一层
 * .=2向下两层
 * .<3三层以内
 * .[a,b,c]同时拥有三个a,b,c三个属性的值
 *
 * @cd(pathname) 根据pathname进入指定层级 / 顶层
 *                                param/ 根据param名称查找
 *                                @it(value) 根据特征查找
 * @prt(.) 打印当前层级地址
 * @prt(..) 打印上一层级地址
 * @prt-cd('@it(value)') 打印根据给定的特征查找的路径
 */
export class Router implements IPlugin{
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
        this.type = "@del,@del-,@new,@pth,@fnd,@vst,@lct,@up"
    }

    /*处理器范式*/
    public process (context:Context,...args):boolean{
        return true;
    }

    // static filter(desRef:string,domain:Object):{data:any,path:string}[]{
    //
    // }
    /**
     * 上一层域
     */
    static up(domain:Object,path?:string|string[],target?:Object):{data:Object,path:string,ref:string}|{data:Object,path:string,ref:string}[]{
        if(!domain){
            return null;
        }
        let isSingle = false;
        if(path || target) {
            if(path){
                let paths = [];
                if (typeof path == 'string') {
                    isSingle = true;
                    paths.push(path as string);
                }else {
                    paths = path as string[];
                }
                paths = paths.map(path=>{
                    if (path == ""){
                        return {data:domain,path:"",ref:null};
                    }else{
                        let pathArr:string[] = Router.path_split(path);
                        let refName = pathArr.pop();
                        let upPath = Router.path_join(pathArr);
                        return {data:Value.value(domain,upPath),path:upPath,ref:refName};
                    }
                });
                if(isSingle){
                    return paths[0];
                }else{
                    return paths as {data:Object,path:string,ref:string}[];
                }
            }else
            if(target && typeof target == "object"){
                console.log(JSON.stringify(Router.locate(target,domain)));
                return Router.up(domain,Router.locate(target,domain));
            }
        }else{
            return {data:domain,path:"",ref:null};
        }
    }

    static PATH_SPLIT = '/';
    static PATH_SYMBO = '!@#$%^&*';
    static path_join(paths:string[]):string{
        let link = paths.map(path=>{
           if(path.indexOf(Router.PATH_SPLIT)!=-1){
                return path.replace(Router.PATH_SPLIT,Router.PATH_SYMBO);
           }
            return path;
        });
        return link.join(Router.PATH_SPLIT);
    }

    static path_split(path:string):string[]{
        return path.split(Router.PATH_SPLIT).map(path=>{
            if(path.indexOf(Router.PATH_SYMBO)!=-1){
                return path.replace(Router.PATH_SYMBO,Router.PATH_SPLIT);
            }
            return path;
        });
    }

    static path_cd(path:string[]|string,dirName:string):string{
        let paths:string[];
        if(typeof path == 'string'){
            if(path == ""){
                paths = [];
            }else{
                paths = Router.path_split(path as string);
                // console.log("path_split_before:",path);
                // console.log("path_split_after:",paths);
            }
        }else{
            paths = path as string[];
        }
        paths.push(dirName);
        // console.log("path_cd_after:",paths);
        return Router.path_join(paths);
    }
    /**
     * 求当前域的path
     */
    static locate(target:Object,inDomain:Object,ret?:string[],_path?:string[]):string[]{
        if(!ret){
            ret = [];
        }
        if(!_path){
            _path = [];
        }
        if(typeof target == "object" && typeof inDomain =="object"){
            let strIndomain = JSON.stringify(inDomain);
            let strTarget = JSON.stringify(target);
            if(strIndomain.indexOf(strTarget) != -1){
                if(strTarget != strIndomain){
                    let keys = Object.keys(inDomain);
                    // console.log(keys);
                    for(let key of keys){
                        _path.push(key);
                        Router.locate(target,inDomain[key],ret,_path);
                        _path.pop();
                    }

                }else{
                    ret.push(Router.path_join(_path));
                }
            }
        }
        return ret;
    }
    /**
     * 将域A上的pathA的点与域B的pathB的点合并在域A上
     * 注:域A和域B不能为同一个域,如要指定同一个域请使用Utils.copyStringifyData方法深拷贝
     */
    static mixBtoA(domainA:Object,pathA:string,domainB:Object,pathB:string,conflictPath?:{data:any,path:string}[]){
        let valueA = Value.value(domainA,pathA);
        let valueB = Value.value(domainB,pathB);
        // console.log("mixBtoA pathA:",pathA,valueA);
        // console.log("mixBtoA pathB:",pathB,valueB);

        if(typeof valueA != 'object' ||
            typeof valueB != 'object'){
            if(conflictPath){
                conflictPath.push({data:valueA,path:pathA});
            }
            let newPath = Router.path_split(pathA);
            let refName = newPath.pop();
            Value.value(domainA,Router.path_join(newPath))[refName] = valueB;
        }else{
            // if(!valueB){
            //     console.log(domainB,pathB);
            // }
            let keys = Object.keys(valueB);
            for(let key of keys){
                if(key in valueA){
                    // if(pathA == "ValueReverse"){
                    //     console.error("key",key);
                    // }
                    let cd_pathA = Router.path_cd(pathA,key);
                    let cd_pathB = Router.path_cd(pathB,key);
                    // if(pathA == "ValueReverse"){
                    //     console.error("cd_pathA",cd_pathA);
                    // }
                    Router.mixBtoA(
                        domainA,cd_pathA,
                        domainB,cd_pathB,
                        conflictPath
                    );
                }else{
                    valueA[key] = valueB[key];
                }
            }
        }
    }

    static find(ref:string,domain:Object,filter?:string):{data:any,path:string}[]{
        let ret = [];
        let path = [];
        let refSeek = (ref,obj,path,ret)=>{
            if(typeof obj != 'object'){
                return;
            }
            for(let key of Object.keys(obj)){
                if(key == ref){
                    //path_cd改变了原值
                    ret.push({data:obj[key],path:Router.path_cd(Utils.copyStringifyData(path),key)});
                }
                if(filter == '..'){
                    refSeek(ref,obj[key],[...path,key],ret);
                }
            }
        };
        refSeek(ref,domain,path,ret);
        return ret;
    }

    static visit(ref:string,domain:Object,path:string):{data:any,path:string}{
        let targetDomain = Value.value(domain,path);
        if(targetDomain != null && typeof targetDomain == "object"){
            for(let key of Object.keys(targetDomain)){
                if(key == ref){
                    return {data:targetDomain[key],path:Router.path_cd(path,key)}
                }
            }
            //如果不是顶层则向上
            if(path != ""){
                let res:any = Router.up(domain,path);
                if(res != null){
                    return Router.visit(ref,domain,res.path);
                }
            }
        }
        return null;
    }

    static _deprecated_visit(ref:string,domain:Object,path:string):{data:any,path:string}{
        let search_domain = domain;
        if(path && path.indexOf('/') != -1){
            let pNames = path.split('/');
            pNames.forEach(pName=>{
                search_domain = search_domain[pName];
            });
            console.log(pNames);
            console.log("search_domain:%s",JSON.stringify(search_domain));
            let lastP;
            //如果有,返回当前层
            if(ref in search_domain){
                return {data:search_domain[ref],path:[...pNames,ref].join('/')};
            // }
            // if((lastP = pNames.pop()) in search_domain && ref in search_domain[lastP]){
            //     return search_domain[lastP][ref];
            }else{
                //如果没有,嵌套返回上一层
                pNames.pop();
                return Router.visit(ref,domain,pNames.join('/'));
            }
        }else {
            // console.log(path,domain,ref);
            // return domain[path][ref];
            if(path && path != '' && path in domain && ref in domain[path]){
                //第一层
                return {data:domain[path][ref],path:[path,ref].join('/')};
            }else if(ref in domain){
                //顶层
                return {data:domain[ref],path:ref};
            }else {
                //找不到
                return null;
            }
        }
    }
}