/*
    dsp: directive to show the game view of fencing
    author: Mingdong
    logs:
        migrated to d3.v4
        2018/01/24
 */
mainApp.directive('fencingGameVis', function () {
    //console.log("myTree Initializing");
    function link(scope, el, attr) {
        // properties
        function getEnd(d){
            return d.time_end;
        }
        function getStart(d){
            return d.time_start;
        }

        function fencingGameVis(){
            el = el[0];
            // 0.definition

            // 0.1.scale
            var xGameScale=d3.scaleTime()
            var yGameScale=d3.scaleLinear();

            // 0.2.size
            var svgGameW=100;
            var svgGameH=100;
            var svgGameBGW=100;
            var svgGameBGH=100;
            var margin = {top: 20, right: 40, bottom: 60, left: 20};

            // 0.3.data
            var nodes=[];
            var grids=[];

            // 1.Add DOM elements
            // 1.1.append a svg as background
            var svgGameBG=d3.select(el).append("svg").attr("width",svgGameBGW).attr("height",svgGameBGH);

            // 1.2.add group for the game
            var svgGame=svgGameBG.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // 1.3.add two axes
            var xTreeAxis=svgGame.append('g')
            var yTreeAxis=svgGame.append('g')
            var yTreeAxisR=svgGame.append('g')

            // 2.function
            // 2.1.get all the nodes of the tree
            var generateGrids = function () {
                var nodes = scope.data.phrases;
            //    console.log(nodes)
                // 1.Calculate x domain
                var xMin=d3.min(nodes,function(d){return getStart(d);});
                var xMax=d3.max(nodes,function(d){return getEnd(d);});

                var yMin=d3.min(nodes,function(d){return d.scores[0]>d.scores[1]?d.scores[1]:d.scores[0];});
                var yMax=d3.max(nodes,function(d){return d.scores[0]>d.scores[1]?d.scores[0]:d.scores[1];})
                // 2.2.put them to the middle


                // calculate grid
                xGameScale.domain([xMin,xMax]);
                yGameScale.domain([yMax,yMin]);
                grids=[];
                var time_start,time_end;
                for(var i=0;i<nodes.length;i++){
                    if(nodes[i].scores[0]==8||nodes[i].scores[1]==8){
                        time_start=nodes[i-1].time_end;
                        time_end=nodes[i].time_start;
                        break;
                    }
                }
                grids.push({start:time_start,end:time_end});
            }

            // 2.2.response the size-change
            function resize() {
                //    console.log("====================rezize=====================")

                svgGameBG.attr("width",svgGameBGW)
                    .attr("height",svgGameBGH);
                svgGameW=svgGameBGW-margin.left-margin.right;
                svgGameH=svgGameBGH-margin.top-margin.bottom;

                //    axisHeight = svgH - margin;
                xGameScale.range([0,svgGameW]);
                // *2 is for the axis
                yGameScale.range([0,svgGameH]);
                //console.log("SVGH:"+svgGameH);
                redraw();
            }

            // 2.3.render axes
            function renderAxis(){
                var axis = d3.axisBottom()
                    .scale(xGameScale) // <-E
                xTreeAxis
                    .attr("transform", "translate(0," + (svgGameH+10) + ")")
                    .call(axis
                        .tickFormat(d3.timeFormat("%M:%S")))


                var y_axis = d3.axisLeft()
                    .scale(yGameScale)
                yTreeAxis
                    .call(y_axis.ticks(15))


                var y_axis_r = d3.axisRight()
                    .scale(yGameScale)
                yTreeAxisR
                    .attr("transform", "translate("+svgGameW+",0)")
                    .call(y_axis_r.ticks(15))
            }

            // 2.4.redraw grid
            function _drawGrid(){
                var svgGrids=svgGame.selectAll('.grid').data(grids);
                svgGrids
                    .enter().append("rect")
                    .classed("grid",true)
                    .attr("x", function(d) { return xGameScale(d.start)})
                    .attr("width", function(d) { return xGameScale(d.end)-xGameScale(d.start)})
                    .attr("y", -margin.top )
                    .attr("height", svgGameBGH )
                svgGrids
                    .attr("x", function(d) { return xGameScale(d.start)})
                    .attr("width", function(d) { return xGameScale(d.end)-xGameScale(d.start)})
                    .attr("y", -margin.top )
                    .attr("height", svgGameBGH )
                svgGrids.exit()
                    .remove();
            }

            // 2.5.redraw info
            function _drawInfo(){
                var svgInfo=svgGame.selectAll('.info').data(scope.data.selectedInfo);
                svgInfo.enter().append('text')
                    .classed("info",true)
                    .attr("x",5)
                    .attr("y",function(d,i){return 20+i*20;})
                    .text(function(d){return d;});

                svgInfo
                    .attr("x",5)
                    .attr("y",function(d,i){return 20+i*20;})
                    .text(function(d){return d;});

                svgInfo.exit().remove();

            }

            // 2.6.redraw events
            function _drawEvents() {
                var svgEvents1 = svgGame.selectAll(".event1").data(nodes);

                svgEvents1.enter()
                    .append('rect')
                    .classed("event1",true)
                    .attr("stroke", function (d) {
                        return 'red';
                    })
                    //.attr("stroke","blue")
                    .attr("width", function (d) {
                        return xGameScale(getEnd(d)) - xGameScale(getStart(d));
                    })
                    .attr("height", 6)
                    .attr("x", 0)
                    .attr("y", -3)
                    .attr("transform", function (d) {
                        // This is where we use the index here to translate the pie chart and rendere it in the appropriate cell.
                        // Normally, the chart would be squashed up against the top left of the cell, obscuring the text that shows the day of the month.
                        // We use the gridXTranslation and gridYTranslation and multiply it by a factor to move it to the center of the cell. There is probably
                        // a better way of doing this though.
                        var currentDataIndex = d[1];
                        return "translate(" + xGameScale(getStart(d)) + ", " + yGameScale(d.scores[0]) + ")";
                    })
                    .on('mouseenter', function (d) {
                        // console.log("mouse enter");
                    })
                    .on('mouseover', function (d) {
                        // console.log("mouse over");
                        scope.data.onFocusedPhrase(d.bout-1);

                    })
                    .on('mouseleave', function (d) {
                        // console.log("mouse leave");
                        scope.data.onFocusedPhrase(-1);
                    });

                svgEvents1
                    .classed("focused",function(d){return d.focused})
                    .attr("stroke", function (d) {
                        return 'red';
                    })
                    //.attr("stroke","blue")
                    .attr("width", function (d) {
                        return xGameScale(getEnd(d)) - xGameScale(getStart(d));
                    })
                    .attr("height", 6)
                    .attr("x", 0)
                    .attr("y", -3)
                    .attr("transform", function (d) {
                        // This is where we use the index here to translate the pie chart and rendere it in the appropriate cell.
                        // Normally, the chart would be squashed up against the top left of the cell, obscuring the text that shows the day of the month.
                        // We use the gridXTranslation and gridYTranslation and multiply it by a factor to move it to the center of the cell. There is probably
                        // a better way of doing this though.
                        var currentDataIndex = d[1];
                        return "translate(" + xGameScale(getStart(d)) + ", " + yGameScale(d.scores[0]) + ")";
                    })

                // without this, the page won't update when an node is deleted
                svgEvents1.exit().remove();

                var svgEvents2 = svgGame.selectAll(".event2").data(nodes);

                svgEvents2.enter()
                    .append('rect')
                    .classed("event2",true)
                    .attr("stroke", function (d) {
                        return 'blue';
                    })
                    //.attr("stroke","blue")
                    .attr("width", function (d) {

                        return xGameScale(getEnd(d)) - xGameScale(getStart(d));
                    })
                    .attr("height", 6)
                    .attr("x", 0)
                    .attr("y", -3)
                    .attr("transform", function (d) {
                        // This is where we use the index here to translate the pie chart and rendere it in the appropriate cell.
                        // Normally, the chart would be squashed up against the top left of the cell, obscuring the text that shows the day of the month.
                        // We use the gridXTranslation and gridYTranslation and multiply it by a factor to move it to the center of the cell. There is probably
                        // a better way of doing this though.
                        var currentDataIndex = d[1];
                        return "translate(" + xGameScale(getStart(d)) + ", " + yGameScale(d.scores[1]) + ")";
                    })
                    .on('mouseenter', function (d) {
                        // console.log("mouse enter");
                    })
                    .on('mouseover', function (d) {
                        // console.log("mouse over");
                        scope.data.onFocusedPhrase(d.bout-1);

                    })
                    .on('mouseleave', function (d) {
                        // console.log("mouse leave");
                        scope.data.onFocusedPhrase(-1);
                    });

                svgEvents2
                    .classed("focused",function(d){return d.focused})
                    .attr("stroke", function (d) {
                        return 'blue';
                    })
                    //.attr("stroke","blue")
                    .attr("width", function (d) {

                        return xGameScale(getEnd(d)) - xGameScale(getStart(d));
                    })
                    .attr("height", 6)
                    .attr("x", 0)
                    .attr("y", -3)
                    .attr("transform", function (d) {
                        // This is where we use the index here to translate the pie chart and rendere it in the appropriate cell.
                        // Normally, the chart would be squashed up against the top left of the cell, obscuring the text that shows the day of the month.
                        // We use the gridXTranslation and gridYTranslation and multiply it by a factor to move it to the center of the cell. There is probably
                        // a better way of doing this though.
                        var currentDataIndex = d[1];
                        return "translate(" + xGameScale(getStart(d)) + ", " + yGameScale(d.scores[1]) + ")";
                    })

                // without this, the page won't update when an node is deleted
                svgEvents2.exit().remove();
            }

            // 2.7.redraw phrases
            function _drawPhrases(){
                var svgPhrases=svgGame.selectAll(".phrase").data(scope.data.phrases);
                svgPhrases.enter()
                    .append('rect')
                    .classed("phrase",true)
                    .attr("stroke",function(d){
                        if(d.score==1) return 'red';
                        else if(d.score==2) return 'blue';
                        else return 'grey'
                    })
                    //.attr("stroke","blue")
                    .attr("width",function(d){

                        return xGameScale(getEnd(d))-xGameScale(getStart(d));
                    })
                    .attr("height",20)
                    .attr("x",0)
                    .attr("y",-3)
                    .attr("transform", function (d) {
                        // This is where we use the index here to translate the pie chart and rendere it in the appropriate cell.
                        // Normally, the chart would be squashed up against the top left of the cell, obscuring the text that shows the day of the month.
                        // We use the gridXTranslation and gridYTranslation and multiply it by a factor to move it to the center of the cell. There is probably
                        // a better way of doing this though.
                        var currentDataIndex = d[1];
                        return "translate(" +  xGameScale(getStart(d)) + ", "+(svgGameH+40)+")";
                    })
                    .on('mouseenter', function (d) {
                        // console.log("mouse enter");
                    })
                    .on('mouseover', function (d) {
                        // console.log("mouse over");
                        scope.data.onFocusedPhrase(d.bout-1);

                    })
                    .on('mouseleave', function (d) {
                        scope.data.onFocusedPhrase(-1);
                    });

                svgPhrases
                    .classed("focused",function(d){return d.focused})
                    .attr("stroke",function(d){
                        if(d.score==1) return 'red';
                        else if(d.score==2) return 'blue';
                        else return 'grey'
                    })
                    //.attr("stroke","blue")
                    .attr("width",function(d){

                        return xGameScale(getEnd(d))-xGameScale(getStart(d));
                    })
                    .attr("height",20)
                    .attr("x",0)
                    .attr("y",-3)
                    .attr("transform", function (d) {
                        // This is where we use the index here to translate the pie chart and rendere it in the appropriate cell.
                        // Normally, the chart would be squashed up against the top left of the cell, obscuring the text that shows the day of the month.
                        // We use the gridXTranslation and gridYTranslation and multiply it by a factor to move it to the center of the cell. There is probably
                        // a better way of doing this though.
                        var currentDataIndex = d[1];
                        return "translate(" +  xGameScale(getStart(d)) + ", "+(svgGameH+40)+")";
                    })

                // without this, the page won't update when an node is deleted
                svgPhrases.exit().remove();
            }

            function _drawPhrasesBG(){
                var filterPhrases=scope.data.phrases.filter(function(d){return scope.data.filters[d.bout-1]==0});
                var svgPhrasesBG=svgGame.selectAll(".phrasebg").data(filterPhrases);
                svgPhrasesBG.enter()
                    .append('rect')
                    .classed("phrasebg",true)
                    .attr("stroke",function(d){
                        if(d.score==1) return 'red';
                        else if(d.score==2) return 'blue';
                        else return 'grey'
                    })
                    .attr("x", function(d) { return xGameScale(getStart(d))})
                    .attr("width", function(d) { return xGameScale(getEnd(d))-xGameScale(getStart(d))})
                    .attr("y", -margin.top )
                    .attr("height", svgGameBGH )
                    .on('mouseenter', function (d) {
                        // console.log("mouse enter");
                    })
                    .on('mouseover', function (d) {
                        // console.log("mouse over");
                        scope.data.onFocusedPhrase(d.bout-1);

                    })
                    .on('mouseleave', function (d) {
                        scope.data.onFocusedPhrase(-1);
                    });

                svgPhrasesBG
                    .classed("focused",function(d){return d.focused})
                    .attr("stroke",function(d){
                        if(d.score==1) return 'red';
                        else if(d.score==2) return 'blue';
                        else return 'grey'
                    })
                    .attr("x", function(d) { return xGameScale(getStart(d))})
                    .attr("width", function(d) { return xGameScale(getEnd(d))-xGameScale(getStart(d))})
                    .attr("y", -margin.top )
                    .attr("height", svgGameBGH )

                // without this, the page won't update when an node is deleted
                svgPhrasesBG.exit().remove();
            }

            // 2.8.redraw the svg
            function redraw(){
            //    console.log("redraw")
                if (!scope.data) { return };
                if(scope.data.phrases.length==0) return;

                generateGrids()
                nodes=scope.data.phrases;

                // draw grids
                _drawGrid();
                _drawInfo();

                _drawEvents();
                _drawPhrases();
                _drawPhrasesBG();

                renderAxis();
            }



            // watch the size of the window
            scope.$watch(function () {
                //    console.log("watching===============svgGameBG")
                svgGameBGW = el.clientWidth;
                svgGameBGH = el.clientHeight;
            //    if(svgGameBGW<600) svgGameBGW=600;
            //    if(svgGameBGH<200) svgGameBGH=200;
                return svgGameBGW + svgGameBGH;
            }, resize);
            // watch the change of the data
            scope.$watch('data', redraw);
            scope.$watch('data.focused_bout', redraw);
            scope.$watchCollection('data.phrases', redraw);
            scope.$watchCollection('data.filters', redraw);

        }

        fencingGameVis();
    }
    return {
        link: link,
        restrict: 'E',
        scope: { data: '=', selectedPoint: '=' }
    };
});
