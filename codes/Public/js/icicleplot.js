
function myTreemapDice(parent, x0, y0, x1, y1) {
    var nodes = parent.children,
        node,
        i = -1,
        n = nodes.length,
        k = parent.value && (x1 - x0) / parent.value;

    while (++i < n) {
        node = nodes[i], node.y0 = y0, node.y1 = y1;
        node.x0 = x0, node.x1 = x0 += node.value * k;
    }
}

function myPartition() {
    var dx = 1,
        dy = 1,
        padding = 0;

    function partition(root) {
        var n = root.height + 1;
        root.x0 =
            root.y0 = padding;
        root.x1 = dx;
        root.y1 = dy / n;
        root.eachBefore(positionNode(dy, n));
        return root;
    }

    function positionNode(dy, n) {
        return function(node) {
            if (node.children) {
                myTreemapDice(node
                    , node.x0
                    , dy * (node.depth + 1) / n
                    , node.x1
                    , dy * (node.depth + 2) / n);
            }
            var x0 = node.x0,
                y0 = node.y0,
                x1 = node.x1 - padding,
                y1 = (node.children? node.y1:dy) - padding;
            if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
            if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
            node.x0 = x0;
            node.y0 = y0;
            node.x1 = x1;
            node.y1 = y1;
        };
    }

    partition.size = function(x) {
        return arguments.length ? (dx = +x[0], dy = +x[1], partition) : [dx, dy];
    };

    partition.padding = function(x) {
        return arguments.length ? (padding = +x, partition) : padding;
    };

    return partition;
}

myApp.directive('iciclePlot', function () {
    function link(scope, el, attr) {
        iciplePlot=function(){
            //var svgTreeWidth=301;
            var svgTreeWidth=151
            var svgWidth=600;
            var svgHeight=400;
            var color = d3.scaleOrdinal(d3.schemeCategory10);
            var svgArea=d3.select(el[0]).append("svg");
            var svg1 = svgArea.append("g");
            var svg2=svgArea.append("g").attr("transform", function(d) { return "translate(" + svgTreeWidth*1 + "," + 0 + ")"; });
            var svg3=svgArea.append("g").attr("transform", function(d) { return "translate(" + svgTreeWidth*2 + "," + 0 + ")"; });
            var svg4=svgArea.append("g").attr("transform", function(d) { return "translate(" + svgTreeWidth*3 + "," + 0 + ")"; });
            var svg5=svgArea.append("g").attr("transform", function(d) { return "translate(" + svgTreeWidth*4 + "," + 0 + ")"; });
            var svg6=svgArea.append("g").attr("transform", function(d) { return "translate(" + svgTreeWidth*5 + "," + 0 + ")"; });
            var svg7=svgArea.append("g").attr("transform", function(d) { return "translate(" + svgTreeWidth*6 + "," + 0 + ")"; });
            var svg8=svgArea.append("g").attr("transform", function(d) { return "translate(" + svgTreeWidth*7 + "," + 0 + ")"; });

            var svg = svgArea.append("g");



            scope.$watch(function () {
                //    console.log("watching===============svgStreamBG")
                svgWidth = el[0].clientWidth;
                svgHeight = el[0].clientHeight;
                if(svgWidth<100) svgWidth=100;
                if(svgHeight<100) svgHeight=100;

                return svgWidth + svgHeight;
            }, resize);
            // response the size-change
            function resize() {
                //console.log("====================resize pyramid=================");

                redraw();
            }

            function redraw(){
                //console.log("redraw: "+svgWidth+","+svgHeight);
                svgArea
                    .attr("width", svgWidth)
                    .attr("height", svgHeight)

                if(scope.data.hierarchy.length<1) return;

                var tree_width=scope.data.tree_width;
                var tree_len=scope.data.tree_len;

                function partition(data){
                    var partition=myPartition()
                        .size([svgHeight, svgTreeWidth])
                        .padding(2)

                    return partition(data)
                }
                var data1=scope.data.hierarchy[0];
                var data2=scope.data.hierarchy[1];
                var data3=scope.data.hierarchy[2];
                var data4=scope.data.hierarchy[3];
                var data5=scope.data.hierarchy[4];
                var data6=scope.data.hierarchy[5];
                var data7=scope.data.hierarchy[6];
                var data8=scope.data.hierarchy[7];

                var root1=partition(data1)
                var root2=partition(data2)
                var root3=partition(data3)
                var root4=partition(data4)
                var root5=partition(data5)
                var root6=partition(data6)
                var root7=partition(data7)
                var root8=partition(data8)

                var items1=root1.descendants();
                var items2=root2.descendants();
                var items3=root3.descendants();
                var items4=root4.descendants();
                var items5=root5.descendants();
                var items6=root6.descendants();
                var items7=root7.descendants();
                var items8=root8.descendants();
                var items_arr=[items1,items2,items3,items4,items5,items6,items7,items8];

                function drawHierarchy(data,svg){


                    //console.log(data)

                    var cell = svg
                        .selectAll(".node")
                        .data(data)

                    var newCell=cell
                        .enter()
                        .append("g")

                    function setCell(cell){
                        cell
                            .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
                            .attr("transform", function(d) { return "translate(" + d.y0 + "," + d.x0 + ")"; });
                    }

                    setCell(cell)
                    setCell(newCell)

                    function setRects(rects){
                        rects
                            .attr("width", function(d){return d.y1 - d.y0})
                            .attr("height", function(d){return d.x1 - d.x0})
                            .attr("fill-opacity", 0.6)
                            .attr("fill", function(d){
                                if (d.hasOwnProperty('children')) return "#ccc";
                                else return color(d.data.name);
                                if (!d.depth) return "#ccc";
                                while (d.depth > 1) d = d.parent;
                                return color(d.data.name);
                            })
                            .attr("stroke",function(d){
                                if(d.data.name==scope.data.focused && !d.hasOwnProperty('children'))
                                    return 'black'
                                else return 'none'
                            })
                            .on('mouseenter', function (d) {
                                scope.data.focused=d.data.name;
                                redraw()
                            })
                            .on('mouseleave', function (d) {
                            })
                            .on('click', function (d) {
                                console.log(d)
                            })
                    }
                    newCell.append("rect");
                    var rects=svg.selectAll("rect")
                        .data(data)
                    setRects(rects);
                    //setRects(newRects);



                    newCell
                    //.filter(function(d){return (d.x1 - d.x0) > 16})
                    //.filter(function(d){return !d.hasOwnProperty('children')})
                        .append("text")

                    var text = svg.selectAll("text").data(data)
                    text
                        .attr("x", function(d){
                            return d.y1-d.y0-15;
                        })
                        .attr("y", function(d){
                            return 13;
                            return (d.x1-d.x0)/2
                        })
                        .text(function(d){
                            if(d.hasOwnProperty('children')) return d.value;
                            else return d.data.name;
                        })

                    text.exit().remove()


                    cell.exit().remove()
                }
                drawHierarchy(items1,svg1)
                drawHierarchy(items2,svg2)
                drawHierarchy(items3,svg3)
                drawHierarchy(items4,svg4)
                drawHierarchy(items5,svg5)
                drawHierarchy(items6,svg6)
                drawHierarchy(items7,svg7)
                drawHierarchy(items8,svg8)


                var lines=[];
                // add line of col
                function addLines(col){
                    for(var i=0;i<tree_width*(col-1);i++) lines.push({name:i,x0:0,y0:0,x1:0,y1:0});
                    for(var i=0;i<col;i++){

                        var items=items_arr[i];
                        items.forEach(function(d){
                            var index=d.data.name;
                            if(index<tree_width){
                                if(i>0){
                                    lines[tree_width*(i-1)+index].x1=d.y0+i*svgTreeWidth
                                    lines[tree_width*(i-1)+index].y1=(d.x0+d.x1)/2;
                                }

                                if(i<col-1){
                                    lines[tree_width*i+index].x0=d.y1+i*svgTreeWidth
                                    lines[tree_width*i+index].y0=(d.x0+d.x1)/2;

                                }
                            }
                        })
                    }
                    /*
                    items1.forEach(function(d){
                        var index=d.data.name;
                        if(index<tree_width){
                            lines[index].x0=d.y1
                            lines[index].y0=(d.x0+d.x1)/2;
                        }
                    })
                    items2.forEach(function(d){
                        var index=d.data.name;
                        if(index<tree_width){
                            lines[index].x1=d.y0+301
                            lines[index].y1=(d.x0+d.x1)/2;


                            lines[tree_width+index].x0=d.y1+301
                            lines[tree_width+index].y0=(d.x0+d.x1)/2;
                        }
                    })
                    items3.forEach(function(d){
                        var index=d.data.name;
                        if(index<tree_width){
                            lines[tree_width+index].x1=d.y0+602
                            lines[tree_width+index].y1=(d.x0+d.x1)/2;


                            lines[tree_width*2+index].x0=d.y1+602
                            lines[tree_width*2+index].y0=(d.x0+d.x1)/2;
                        }
                    })
                    items4.forEach(function(d){
                        var index=d.data.name;
                        if(index<tree_width){
                            lines[tree_width*2+index].x1=d.y0+903
                            lines[tree_width*2+index].y1=(d.x0+d.x1)/2;
                        }
                    })
                    */
                }
                addLines(8)

                var svgLink = svg.selectAll(".link").data(lines);
                function setLink(link){
                    link
                        .attr('d', function(d) {
                            return `M ${d.x0} ${d.y0}
                                C ${(d.x0+d.x1)/2} ${d.y0},
                                  ${(d.x0+d.x1)/2} ${d.y1},
                                  ${d.x1} ${d.y1}`
                        })
                        .style("stroke-width", function(d){return svgHeight/tree_width-2})
                        .style("stroke-opacity", function(d){
                            if((d.name % tree_width)==scope.data.focused) return 0.8;
                            else return 0.2;
                        })
                }
                setLink(svgLink.enter().append('path', "g")
                    .attr("class", "link"))


                setLink(svgLink);

                svgLink.exit().remove();

            }
            redraw();
            scope.$watch('data.hierarchy', redraw);
            scope.$watch('data', redraw);
        }
        iciplePlot();
    }
    return {
        link: link,
        restrict: 'E',
        scope: { data: '=' }
    };
});