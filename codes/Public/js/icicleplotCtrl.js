
var myApp = angular.module('myApp', []);

myApp.controller('iciclePlotCtrl', function ($window,$scope, $http) {
    angular.element($window).on('resize', function () { $scope.$apply() });
    $scope.donutChartData={
        hierarchy:[]
        ,focused:-1
        ,tree_width:50      // width of the tree
        ,tree_len:4         // length of tree
    }

    /*
        build the hierarchy structure from merging list
    */
    function buildHierarchy(data){
        var len=data.length+1;  // length of items is length of merging+1
        var list=[];
        // push items
        for (var i=0;i<len;i++){
            list.push({name:i,size:1})
        }
        // push merges
        for (var i=len;i<len*2-1;i++){
            list.push({name:i,children:[]})
        }
        // reversely build their parent-children relationships
        for(var i=len-2;i>=0;i--){
            var node=data[i];
            var id1=node['id1'];
            var id2=node['id2'];
            list[i+len].children.push(list[id1])
            list[i+len].children.push(list[id2])
        }
        return d3.hierarchy(list[len*2-2]);
    }

    /*
        load data
            filename: name of the file
            len: length of each tree data (number of leaves-1, which is number of combinations)
            count: number of trees
            tree_width: width of each tree in svg
            tree_len: number of trees to show
     */
    function loadData(filename,len,count,tree_width,tree_len){
        d3.csv(filename)
            .then(function(data) {
            //    console.log(data)

                // 1.rearrange the list
                var data_array=[];
                for(var i=0;i<count;i++){
                    data_array.push(data.slice(i*len,(i+1)*len));
                }

                // 2.build hierarchy for each list
                var hierarchy_array=[];
                data_array.forEach(function(item){
                    hierarchy_array.push(buildHierarchy(item)
                        .sum(function(d){return d.size})
                        .sort(function(a, b){return b.height - a.height || b.value - a.value}))

                })
                //console.log(hierarchy_array)


                // 3.set index and sequence

                /*
                    for each node except the root set index, 0-first child, 1-second child
                    for each leaf set the sequence, which is the sequence of the last list
                 */
                var currentSequence=0;
                function setChildrenIndex(root){
                    if(root.hasOwnProperty('children')){
                        var c1=root.children[0];
                        var c2=root.children[1];
                        c1['index']=0;
                        c2['index']=1;
                        setChildrenIndex(c1);
                        setChildrenIndex(c2);
                    }
                    else{
                        root['sequence']=currentSequence;
                        currentSequence+=1;
                    }
                }
                hierarchy_array.forEach(function(root){
                    currentSequence=0;
                    setChildrenIndex(root)
                })


                // 4.reset the order according to the list before

                function generateIndexMap(hierarchy){
                    // get leaves of the hierarchy
                    var leaves=hierarchy
                        .descendants()
                        .filter(function(d){return !d.hasOwnProperty('children')})
                        .sort(function(a,b){
                            return a['sequence']-b['sequence'];})
                    var mapIndex=[]
                    mapIndex.length=len+1;
                    for(var i=0;i<len+1;i++) mapIndex[leaves[i].data.name]=i;
                    return mapIndex;
                }

                var arrIndexMap=[]
                hierarchy_array.forEach(function(hierarchy){
                    arrIndexMap.push(generateIndexMap(hierarchy));
                })

                // calculate bias according to order
                function calculateBias_order(indexMap1,indexMap2){
                    var bias=0;
                    for(var i=0;i<len+1;i++){
                        bias+=Math.abs(indexMap1[i]-indexMap2[i])
                    }
                    return bias;
                }

                // calculate bias according to crosses
                function calculateBias_cross(indexMap1,indexMap2){
                    var bias=0;
                    for(var i=0;i<len;i++){
                        for(var j=i+1;j<len+1;j++){
                            if((indexMap1[i]>=indexMap1[j])!=(indexMap2[i]>=indexMap2[j]))
                                bias+=1;
                        }
                    }
                    return bias;
                }


                // increase sequence for a tree given root
                function increaseSequence(root,bias){
                    if(root.hasOwnProperty('children')) {
                        increaseSequence(root.children[0],bias);
                        increaseSequence(root.children[1],bias);
                    }
                    else{
                        root.sequence+=bias;
                    }
                }

                // swap the children of the root
                function swapChildren(root){
                    var cR=root.children[0];
                    var cL=root.children[1];
                    root.children[0]=cL
                    root.children[1]=cR;
                    increaseSequence(cL,-cR.value);
                    increaseSequence(cR,cL.value);
                }

                function optimizationFun_order(cL,cR, indexMapLeft){
                    var bias0=0;
                    var bias1=0;
                    var biasL=cL.value;
                    var biasR=cR.value;
                    var leavesL=cL.descendants().filter(function(d){return !d.hasOwnProperty('children')})
                    var leavesR=cR.descendants().filter(function(d){return !d.hasOwnProperty('children')})

                    leavesL.forEach(function(d){
                        var index=d.data.name;
                        bias0+=Math.abs(d.sequence-indexMapLeft[index]);
                        bias1+=Math.abs(d.sequence+biasR-indexMapLeft[index]);
                    })
                    leavesR.forEach(function(d){
                        var index=d.data.name;
                        bias0+=Math.abs(d.sequence-indexMapLeft[index]);
                        bias1+=Math.abs(d.sequence-biasL-indexMapLeft[index]);
                    })
                    return bias1-bias0;
                }
                function optimizationFun_cross(cL,cR, indexMapLeft){
                    var bias0=0;
                    var bias1=0;
                    var leavesL=cL.descendants().filter(function(d){return !d.hasOwnProperty('children')})
                    var leavesR=cR.descendants().filter(function(d){return !d.hasOwnProperty('children')})

                    leavesL.forEach(function(dL){
                        var indexL=dL.data.name;
                        leavesR.forEach(function(dR){
                            var indexR=dR.data.name;
                            if(indexMapLeft[indexL]>indexMapLeft[indexR])
                                bias0+=1;
                            else bias1+=1;
                        })
                    })
                    return bias1-bias0;
                }

                // adjust tree given root according to the map index of the left tree
                function adjustTree(indexMapLeft,root){
                    if(root.hasOwnProperty('children')){
                        //console.log(root.data.name)
                        var cL=root.children[0];
                        var cR=root.children[1];
                        //console.log(leavesL,leavesR)
                        //console.log(bias0,bias1)

                        var cross_result=optimizationFun_cross(cL,cR,indexMapLeft);
                        if (cross_result<0){
                            swapChildren(root);
                        }
                        else if(cross_result==0){
                            if(optimizationFun_order(cL,cR,indexMapLeft)<0)
                                swapChildren(root);
                        }

                        adjustTree(indexMapLeft,cL);
                        adjustTree(indexMapLeft,cR);
                    }
                }


                // check if change index0 and index1 will down bias
                function checkChange(index0,index1,funCB){
                    var bias_order0=calculateBias_order(arrIndexMap[index0],arrIndexMap[index1])
                    var bias_cross0=calculateBias_cross(arrIndexMap[index0],arrIndexMap[index1])
                    funCB();
                    arrIndexMap[index1]=generateIndexMap(hierarchy_array[index1])
                    var bias_order1=calculateBias_order(arrIndexMap[index0],arrIndexMap[index1])
                    var bias_cross1=calculateBias_cross(arrIndexMap[index0],arrIndexMap[index1])
                    console.log('(',bias_order0,'->',bias_order1,');(',bias_cross0,'->',bias_cross1,')')

                }

                // optimize top two trees by each other
                function top2Optimization(){
                    for (var i=0;i<5;i++){
                        checkChange(1,0,function(){
                            adjustTree(arrIndexMap[1],hierarchy_array[0])
                        })
                        checkChange(0,1,function(){
                            adjustTree(arrIndexMap[0],hierarchy_array[1])
                        })
                    }
                }

                function manuallyOptimization(){
                    checkChange(1,0,function(){
                        swapChildren(hierarchy_array[0].children[0])

                    })
                    checkChange(0,1,function(){
                        adjustTree(arrIndexMap[0],hierarchy_array[1])
                    })
                }

                function sequentiallyOptimization(){
                    for(var i=0;i<count-1;i++){
                        checkChange(i,i+1,function(){
                            adjustTree(arrIndexMap[i],hierarchy_array[i+1])
                        })
                    }
                }

                function reverselyOptimization(){
                    for(var i=9;i>0;i--){
                        checkChange(i,i-1,function(){
                            adjustTree(arrIndexMap[i],hierarchy_array[i-1])
                        })
                    }
                }

                //manuallyOptimization();
                //top2Optimization();
                sequentiallyOptimization()
                //reverselyOptimization()

                console.log(hierarchy_array)
                $scope.donutChartData.hierarchy=hierarchy_array
                $scope.donutChartData.tree_width=tree_width;
                $scope.donutChartData.tree_len=tree_len;
                $scope.$apply();
            })
            .catch(function(error){
                // handle error
            })

    }

    // load ensemble data
    function loadEnsembleData(){
        var filename='data/clusters.csv';
        var len=49;
        var count=10;
        var tree_width=50;
        var tree_len=4;

        loadData(filename,len,count,tree_width,tree_len);
    }

    // load water data
    function loadWaterData(){
        var filename='data/clusters_water.csv';
        var len=4;
        var count=8;
        var tree_width=5;
        var tree_len=8;

        loadData(filename,len,count,tree_width,tree_len);
    }

    //loadEnsembleData()
    loadWaterData()


    // aborted functions
    function loadEnsembleData_old(){
        d3.csv('data/clusters.csv')
            .then(function(data) {
                //console.log(data)


                var len=49;
                var count=10;
                // 1.arrange the list to 10 lists
                var data_array=[];
                for(var i=0;i<count;i++){
                    data_array.push(data.slice(i*len,(i+1)*len));
                }
                var hierarchy_array=[];
                // 2.build hierarchy for each list
                data_array.forEach(function(item){
                    hierarchy_array.push(buildHierarchy(item)
                        .sum(function(d){return d.size})
                        .sort(function(a, b){return b.height - a.height || b.value - a.value}))

                })

                // 3.reset the order according to the list before

                /*
                    for each node except the root set index, 0-first child, 1-second child
                    for each leaf set the sequence, which is the sequence of the last list
                 */
                var currentSequence=0;
                function setChildrenIndex(root){
                    if(root.hasOwnProperty('children')){
                        var c1=root.children[0];
                        var c2=root.children[1];
                        c1['index']=0;
                        c2['index']=1;
                        setChildrenIndex(c1);
                        setChildrenIndex(c2);
                    }
                    else{
                        root['sequence']=currentSequence;
                        currentSequence+=1;
                    }
                }
                hierarchy_array.forEach(function(root){
                    currentSequence=0;
                    setChildrenIndex(root)
                })

                function generateIndexMap(hierarchy){
                    // get leaves of the hierarchy
                    var leaves=hierarchy
                        .descendants()
                        .filter(function(d){return !d.hasOwnProperty('children')})
                        .sort(function(a,b){
                            return a['sequence']-b['sequence'];})
                    var mapIndex=[]
                    mapIndex.length=len+1;
                    for(var i=0;i<len+1;i++) mapIndex[leaves[i].data.name]=i;
                    return mapIndex;
                }
                var arrIndexMap=[]
                hierarchy_array.forEach(function(hierarchy){
                    arrIndexMap.push(generateIndexMap(hierarchy));
                })

                function calculateBias_order(indexMap1,indexMap2){
                    var bias=0;
                    for(var i=0;i<len+1;i++){
                        bias+=Math.abs(indexMap1[i]-indexMap2[i])
                    }
                    return bias;
                }
                function calculateBias_cross(indexMap1,indexMap2){
                    var bias=0;
                    for(var i=0;i<len;i++){
                        for(var j=i+1;j<len+1;j++){
                            if((indexMap1[i]>=indexMap1[j])!=(indexMap2[i]>=indexMap2[j]))
                                bias+=1;
                        }
                    }
                    return bias;
                }
                //console.log(hierarchy_array[0])
                //console.log(arrIndexMap)


                function increaseSequence(root,bias){
                    if(root.hasOwnProperty('children')) {
                        increaseSequence(root.children[0],bias);
                        increaseSequence(root.children[1],bias);
                    }
                    else{
                        root.sequence+=bias;
                    }
                }
                // swap the children of the root
                function swapChildren(root){
                    var cR=root.children[0];
                    var cL=root.children[1];
                    root.children[0]=cL
                    root.children[1]=cR;
                    increaseSequence(cL,-cR.value);
                    increaseSequence(cR,cL.value);
                }
                function optimizationFun_order(cL,cR, indexMapLeft){
                    var bias0=0;
                    var bias1=0;
                    var biasL=cL.value;
                    var biasR=cR.value;
                    var leavesL=cL.descendants().filter(function(d){return !d.hasOwnProperty('children')})
                    var leavesR=cR.descendants().filter(function(d){return !d.hasOwnProperty('children')})

                    leavesL.forEach(function(d){
                        var index=d.data.name;
                        bias0+=Math.abs(d.sequence-indexMapLeft[index]);
                        bias1+=Math.abs(d.sequence+biasR-indexMapLeft[index]);
                    })
                    leavesR.forEach(function(d){
                        var index=d.data.name;
                        bias0+=Math.abs(d.sequence-indexMapLeft[index]);
                        bias1+=Math.abs(d.sequence-biasL-indexMapLeft[index]);
                    })
                    return bias1-bias0;
                }
                function optimizationFun_cross(cL,cR, indexMapLeft){
                    var bias0=0;
                    var bias1=0;
                    var leavesL=cL.descendants().filter(function(d){return !d.hasOwnProperty('children')})
                    var leavesR=cR.descendants().filter(function(d){return !d.hasOwnProperty('children')})

                    leavesL.forEach(function(dL){
                        var indexL=dL.data.name;
                        leavesR.forEach(function(dR){
                            var indexR=dR.data.name;
                            if(indexMapLeft[indexL]>indexMapLeft[indexR])
                                bias0+=1;
                            else bias1+=1;
                        })
                    })
                    return bias1-bias0;
                }
                // adjust tree given root according to the map index of the left tree
                function adjustTree(indexMapLeft,root){
                    if(root.hasOwnProperty('children')){
                        //console.log(root.data.name)
                        var cL=root.children[0];
                        var cR=root.children[1];
                        //console.log(leavesL,leavesR)
                        //console.log(bias0,bias1)

                        var cross_result=optimizationFun_cross(cL,cR,indexMapLeft);
                        if (cross_result<0){
                            swapChildren(root);
                        }
                        else if(cross_result==0){
                            if(optimizationFun_order(cL,cR,indexMapLeft)<0)
                                swapChildren(root);
                        }

                        adjustTree(indexMapLeft,cL);
                        adjustTree(indexMapLeft,cR);
                    }
                }

                //console.log(calculateBias(arrIndexMap[0],arrIndexMap[1]))

                /*
                            hierarchy_array[1]
                                .descendants()
                                .filter(function(d){return !d.hasOwnProperty('children')})
                                .forEach(function(d){console.log(d.sequence)})
                */

                function checkChange(index0,index1,funCB){
                    var bias_order0=calculateBias_order(arrIndexMap[index0],arrIndexMap[index1])
                    var bias_cross0=calculateBias_cross(arrIndexMap[index0],arrIndexMap[index1])
                    funCB();
                    arrIndexMap[index1]=generateIndexMap(hierarchy_array[index1])
                    var bias_order1=calculateBias_order(arrIndexMap[index0],arrIndexMap[index1])
                    var bias_cross1=calculateBias_cross(arrIndexMap[index0],arrIndexMap[index1])
                    console.log('(',bias_order0,'->',bias_order1,');(',bias_cross0,'->',bias_cross1,')')

                }
                function top2Optimization(){
                    for (var i=0;i<5;i++){
                        checkChange(1,0,function(){
                            adjustTree(arrIndexMap[1],hierarchy_array[0])
                        })
                        checkChange(0,1,function(){
                            adjustTree(arrIndexMap[0],hierarchy_array[1])
                        })
                    }
                }

                function manuallyOptimization(){
                    checkChange(1,0,function(){
                        swapChildren(hierarchy_array[0].children[0])

                    })
                    checkChange(0,1,function(){
                        adjustTree(arrIndexMap[0],hierarchy_array[1])
                    })
                }


                function sequentiallyOptimization(){
                    for(var i=0;i<9;i++){
                        checkChange(i,i+1,function(){
                            adjustTree(arrIndexMap[i],hierarchy_array[i+1])
                        })
                    }
                }

                function reverselyOptimization(){
                    for(var i=9;i>0;i--){
                        checkChange(i,i-1,function(){
                            adjustTree(arrIndexMap[i],hierarchy_array[i-1])
                        })
                    }
                }

                manuallyOptimization();
                top2Optimization();
                sequentiallyOptimization()
                //reverselyOptimization()


                $scope.donutChartData.hierarchy=hierarchy_array
                $scope.$apply();
            })
            .catch(function(error){
                // handle error
            })
    }

});



