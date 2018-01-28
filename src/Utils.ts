/**
 * Created by jackyanjiaqi on 16/10/18.
 */
export class Utils{
    public static HANDLER_COMPLEMENT = 'complement';//补集
    public static HANDLER_INTERSECTION = 'intersection';//交集

    public static copyStringifyData(object){
        return JSON.parse(JSON.stringify(object));
    }

    //绝对不能用slice
    public static copyDatas(datas){
        let ret = [];
        for(let data of datas){
            ret.push(this.copyData(data));
        }
        return ret;
    }

    //深拷贝对象
    public static copyData(data){
        let newData = {};
        for(let p in data){
            newData[p] = data[p];
        }
        return newData;
    }

    //修改原来的数组 返回一个包含旧元素的新数组
    public static rawMap(target:Array<any>,mapperFunc:(item,index,raw)=>any):Array<any>{
        let temp = [];
        let ret = [];
        for(let i=0;target.length > 0;i++){
            let item = target.shift();
            temp.push(mapperFunc(item,i,target));
            ret.push(item);
        }
        while(temp.length > 0){
            target.unshift(temp.pop());
        }
        return ret;
    }

    //符合@no[json]规范的迭代器
    public static rawEvery(target:Array<any>,walkFunc:(item,index,raw)=>boolean):boolean{
        return target.every(walkFunc);
    }
    //符合@no[json]规范的迭代器
    public static rawSome(target:Array<any>,walkFunc:(item,index,raw)=>boolean):boolean{
        return target.some(walkFunc);
    }

    //修改原来的数组 返回一个被剔除的元素的新数组
    public static rawFilter(target:Array<any>,filterFunc:(item,index,raw)=>boolean):Array<any>{
        let temp = [];
        let ret = [];
        for(let i=0;target.length > 0;i++){
            let item = target.shift();
            if(filterFunc(item,i,target)){
                temp.push(item);
            }else{
                ret.push(item);
            }
        }
        while(temp.length > 0){
            target.unshift(temp.pop());
        }
        return ret;
    }

    public static createArrayExclude(arrayA:Array<Object>,arrayB:Array<any>|string,compareProperty?:string):Array<Object> {
        return Utils.doubleArrayHandle(arrayA,arrayB,Utils.HANDLER_COMPLEMENT,true,compareProperty) as Array<Object>;
    }

    public static arrayExclude(arrayA:Array<any>|string,arrayB:Array<any>|string,compareProperty?:string):Array<any>|string {
        return Utils.doubleArrayHandle(arrayA,arrayB,Utils.HANDLER_COMPLEMENT,false,compareProperty);
    }

    public static createArrayInclude(arrayA:Array<Object>,arrayB:Array<any>|string,compareProperty?:string):Array<Object> {
        return Utils.doubleArrayHandle(arrayA,arrayB,Utils.HANDLER_INTERSECTION,true,compareProperty) as Array<Object>;
    }

    public static arrayInclude(arrayA:Array<any>|string,arrayB:Array<any>|string,compareProperty?:string):Array<any>|string {
        return Utils.doubleArrayHandle(arrayA,arrayB,Utils.HANDLER_INTERSECTION,false,compareProperty);
    }
    /**
     *
     * @param arrayA
     * @param arrayB
     * @param compareProperty
     * @return 返回类型跟随arrayA
     */
    public static doubleArrayHandle(arrayA:Array<any>|string,arrayB:Array<any>|string,handler:string,createNew:boolean,compareProperty?:string):Array<any>|string{
        var type = '';
        let containerMarkerArr:Array<any> = Utils.isMarker(arrayA) ? (type = 'marker' , Utils.markerToMarkerArr(arrayA as string)):
            Utils.isMarkerArr(arrayA as Array<any>) ? (type = 'markerArr', arrayA as Array<any>) : (type = 'array',arrayA as Array<any>);
        let excludeMarker:string = Utils.isMarker(arrayB) ? arrayB as string:
            Utils.isMarkerArr(arrayB as Array<any>) ? Utils.markerArrToMarker(arrayB as Array<any>) : Utils.toMarker(arrayB,compareProperty);
        excludeMarker += ',';
        switch(type){
            case 'marker':
                return containerMarkerArr.filter(marker=>{
                    let index = excludeMarker.indexOf(marker);
                    if(index != -1){
                        excludeMarker = excludeMarker.replace(new RegExp(marker+','),"");
                        return handler == Utils.HANDLER_INTERSECTION;
                    }else{
                        return handler == Utils.HANDLER_COMPLEMENT;
                    }
                }).join();
            case 'markerArr':
                return containerMarkerArr.filter(marker=>{
                    let index = excludeMarker.indexOf(marker);
                    if(index != -1){
                        excludeMarker = excludeMarker.replace(new RegExp(marker+','),"");
                        return handler == Utils.HANDLER_INTERSECTION;
                    }else{
                        return handler == Utils.HANDLER_COMPLEMENT;
                    }
                });
            case 'array':
                let filterFunc = data=>{
                    let marker = data[compareProperty];
                    let index = excludeMarker.indexOf(marker);
                    if(index != -1){
                        excludeMarker = excludeMarker.replace(new RegExp(marker+','),"");
                        return handler == Utils.HANDLER_INTERSECTION;
                    }else{
                        return handler == Utils.HANDLER_COMPLEMENT;
                    }
                };
                if(createNew){
                    //生成新数组
                    return containerMarkerArr.filter(filterFunc);
                }else{
                    //在原数组上操作
                    return Utils.rawFilter(containerMarkerArr,filterFunc);
                }
        }
    }

    public static arrayContained(arrayA:Array<any>|string,arrayB:Array<any>|string,compareProperty?:string):boolean{
        let containerMarker:string = Utils.isMarker(arrayA) ? arrayA as string:
            Utils.isMarkerArr(arrayA as Array<any>) ? Utils.toMarker(arrayA) : Utils.toMarker(arrayA,compareProperty);
        // console.info(containerMarker);
        if(Utils.isMarker(arrayB)){
            arrayB = Utils.markerToMarkerArr(arrayB as string);
        }
        containerMarker += ',';
        for(let itemMarker of arrayB){
            itemMarker = Utils.isMarker(itemMarker)? itemMarker : Utils.toMarker(itemMarker,compareProperty);
            // console.info(containerMarker.indexOf(itemMarker));
            let index = containerMarker.indexOf(itemMarker);
            if(index != -1){
                containerMarker = containerMarker.replace(new RegExp(itemMarker+','),"");
            }else{
                return false;
            }
        }
        return true;
    }

    public static isMarker(target):boolean{
        return typeof target == 'string';
    }

    public static isMarkerArr(target:Array<any>):boolean{
        if(target.length == 0)return true;
        return typeof target[0] == 'string';
    }

    public static toMarker(target:Object[]|Object,markProperty?:string):string{
        if(target instanceof Array){
            return target.map((a:any)=>Utils.toMarker(a,markProperty)).join();
        }else{
            return markProperty?target[markProperty] : target.toString();
        }
    }

    public static toMarkerArr(target:Object[]|Object,markProperty:string):string[]{
        if(target instanceof Array){
            return target.map((a:any)=>Utils.toMarker(a,markProperty));
        }else{
            return null;
        }
    }

    public static markersAdd(m_a:string|string[],m_b:string|string[]):string|string[]{
        if(Utils.isMarker(m_a)){
            if(Utils.isMarker(m_b)){
                return m_a as string + "," + m_b as string;
            }else{
                return m_a as string + ',' + Utils.markerArrToMarker(m_b as string[]);
            }
        }else{
            if(Utils.isMarker(m_b)){
                let add_b:string[] = Utils.markerToMarkerArr(m_b as string);
                return [...m_a as string[],...add_b];
            }else{
                return [...m_a as string[],...m_b as string[]];
            }
        }
    }

    public static markerToMarkerArr(marker:string):string[]{
        return marker.split(',');
    }

    public static markerArrToMarker(markers:string[]):string{
        return markers.join();
    }

    public static markerArrToArr(markers:string[],createFrom:Object[],markProperty:string):Object[]{
        return markers.map(marker=>{
            let ret = null;
            for(let target of createFrom){
                if(target[markProperty] == marker){
                    ret = Utils.copyData(target);
                }
            }
            return ret;
        })
    }

    public static tester(testFunc:(testData)=>boolean,data?):any{
        if(testFunc(data)){
            return data;
        }else{
            throw new Error(`tester failed`);
        }
    }
}