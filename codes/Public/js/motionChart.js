/*
    dsp: directive to show the motion view of fencing
    author: Mingdong
    logs:
        created
        2018/01/25
 */
mainApp.directive('motionChart', function () {
    function link(scope, el, attr) {
        function motionChart(){
            // 0.definition

            // 0.1.size
            var margin = {top: 30, right: 40, bottom: 20, left: 40};
            var svgMotionBGW=1000;
            var svgMotionBGH=800;
            var svgMotionW = svgMotionBGW - margin.left - margin.right;
            var svgMotionH = svgMotionBGH - margin.top - margin.bottom;

            // 0.2.color
            var color = d3.scaleOrdinal(d3.schemeCategory20)

            // 0.3.functions
            // map motion type to color
            function type2color(type){
                if(type=="f") return d3.schemeCategory20[0]
                if(type=="b"||type=="c") return d3.schemeCategory20[1]
                if(type=="a") return d3.schemeCategory20[2]
                return "black"
            }
            // map motion type of hand to color
            function type2color_hand(type){
                if(type=="ha") return d3.schemeCategory20[6]
                if(type=="hp") return d3.schemeCategory20[8]
                if(type=="hr") return d3.schemeCategory20[7]
                if(type=="hc") return d3.schemeCategory20[10]
                return "black"
            }
            // get the color of the phrase
            function phraseColor(phrase){
                if(phrase.score==1) return "red"
                else if(phrase.score==2) return "blue"
                else return "gray"
            }

            // get the y scale value of the phrase or motion
            function getY(d){
                return d.bout;
                if(d.player) return d.bout+"-"+d.player;    // for motion
                else return d.bout+"-1";                    // for phrase, always using player 1
            }

            // get the text of the result
            function resultText(result){
                var chinese=false;
                if(chinese){
                    // chinese
                    if(result=="a") return "进攻反攻"
                    if(result=="i") return "意外情况"
                    if(result=="g") return "一方犯规"
                    if(result=="r") return "防守还击"
                    if(result=="rr") return "反还击"
                    if(result=="b") return "同时互中"

                }
                else{
                    if(result=="a") return "A"
                    if(result=="i") return "I"
                    if(result=="g") return "G"
                    if(result=="r") return "R"
                    if(result=="rr") return "AR"
                    if(result=="b") return "S"
                }
            }


            // 1.Add DOM elements
            var svgBG = d3.select(el[0]).append("svg").attr("width",svgMotionBGW).attr("height",svgMotionBGH);
            var svgMotions=svgBG.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


            var gAxisX=svgMotions.append("g").attr("class", "axis axis--x")
            var gAxisXBottom=svgMotions.append("g").attr("class", "axis axis--x")
            var gAxisY=svgMotions.append("g").attr("class", "axis axis--y")

            scope.$watch(function () {
                //    console.log("watching===============svgStreamBG")
                svgMotionBGW = el[0].clientWidth;

                if(scope.data.Show_all_motions)
                    svgMotionBGH = el[0].clientHeight;
                else
                    svgMotionBGH=svgMotionBGW*4;

                return svgMotionBGW + svgMotionBGH;
            }, resize);
            // response the size-change
            function resize() {
            //    console.log("====================resize motion chart=================");
                svgMotionW = svgMotionBGW - margin.left - margin.right;
                svgMotionH = svgMotionBGH - margin.top - margin.bottom;

                svgBG
                    .attr("width", svgMotionBGW)
                    .attr("height", svgMotionBGH)

                svgMotions
                    .attr("width", svgMotionW)
                    .attr("height", svgMotionH)
                redraw();
            }
            function redraw(){
                //console.log("redraw motion chart");
                function redrawMotions(){
                    function drawPhrases(){
                        // append the rectangles for the background
                        var svgPhrase=svgMotions.selectAll(".phrase").data(phrases);
                        svgPhrase
                            .enter().append("rect")
                            .attr("class", "phrase")
                            .on('mouseenter', function (d) {
                                // console.log("mouse leave");
                                scope.data.onFocusedPhrase(d.bout-1);
                                //    scope.data.focused_bout=d;
                                //    scope.$apply();
                            })
                            .on('mouseleave', function (d) {
                                // console.log("mouse leave");
                                scope.data.onFocusedPhrase(-1);
                                //    scope.data.focused_bout=null;
                                //    scope.$apply();
                            })
                            .on('click', function (d) {
                                // console.log("mouse leave");
                                scope.data.selected_phrase=d.bout;

                                scope.data.show_phrase=!scope.data.show_phrase;
                                scope.$apply();
                            })
                            .attr("x", xScale(0))
                            .attr("width", xScale(0))
                            .attr("y", function(d) {return yScale(getY(d));})
                            .attr("height", function(d){return yScale.bandwidth();})
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(0); })
                            .attr("width", function(d) {return svgMotionW } )
                            .attr("stroke",function(d){return phraseColor(d)})
                        svgPhrase
                            .classed("focused",function(d){return d.focused})
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(0); })
                            .attr("width", function(d) {return svgMotionW } )
                            .attr("stroke",function(d){return phraseColor(d)})
                            .attr("y", function(d) {return yScale(getY(d));})
                            .attr("height", function(d){return yScale.bandwidth();});
                        svgPhrase.exit().remove();

                    }
                    function drawResults(){
                        var svtText=svgMotions.selectAll(".phraseText").data(phrases);
                        svtText
                            .enter().append("text")
                            .attr("class", "phraseText")
                            .text(function(d) { return resultText(d.result); })
                            .attr("x", 0 )
                            .attr("y", function(d) {return yScale(getY(d))+yScale.bandwidth()*.8;})
                            .attr("stroke",function(d){return phraseColor(d)})
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) {return svgMotionW+10 } )

                        svtText
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) {return svgMotionW+10 } )
                            .attr("y", function(d) {return yScale(getY(d))+yScale.bandwidth()*.8;})
                            .text(function(d) { return resultText(d.result)})
                            .attr("stroke",function(d){return phraseColor(d)})


                        svtText.exit().remove();

                    }
                    function drawFootworks(){
                        // append the rectangles for the feet
                        var feet=svgMotions.selectAll(".foot");

                        feet=feet.data(data_feet);
                        feet
                            .enter().append("rect")
                            .attr("class", "foot")
                            .attr("x", xScale(0))
                            .attr("width", xScale(0))
                            .attr("y", function(d) {
                                var y=yScale(getY(d));
                                if(d.player==2) y+=yScale.bandwidth()*.5
                                return y;
                            })
                            .attr("height", yScale.bandwidth()*.5)
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(d.bias_start); })
                            .attr("width", function(d) {return xScale(d.bias_end-d.bias_start); } )
                            .attr("fill",function(d){return type2color(d.type)})
                        feet
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(d.bias_start); })
                            .attr("width", function(d) {return xScale(d.bias_end-d.bias_start); } )
                            .attr("fill",function(d){return type2color(d.type)})
                            .attr("y", function(d) {
                                var y=yScale(getY(d));
                                if(d.player==2) y+=yScale.bandwidth()*.5
                                return y;
                            })
                            .attr("height", yScale.bandwidth()*.5);
                        feet.exit().remove();
                    }
                    function drawBladeworks(){

                        // append the rectangles for the hands
                        var hands=svgMotions.selectAll(".hand")
                        hands=hands.data(data_hands);
                        hands
                            .enter().append("rect")
                            .attr("class", "hand")
                            .attr("x", xScale(0))
                            .attr("width", xScale(0))
                            .attr("y", function(d) {
                                var y=yScale(getY(d));
                                if(d.player==2) y+=yScale.bandwidth()*.5
                                return y;
                            })
                            .attr("height", yScale.bandwidth()*.2)
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(d.bias_start); })
                            .attr("width", function(d) {return xScale(d.bias_end-d.bias_start); } )
                            .attr("fill",function(d){return type2color_hand(d.type)})
                        hands
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(d.bias_start); })
                            .attr("width", function(d) {return xScale(d.bias_end-d.bias_start); } )
                            .attr("fill",function(d){return type2color_hand(d.type)})
                            .attr("y", function(d) {
                                var y=yScale(getY(d));
                                if(d.player==2) y+=yScale.bandwidth()*.5
                                return y;
                            })
                            .attr("height", yScale.bandwidth()*.2)
                        hands.exit().remove();
                    }
                    function drawTactics(){
                        var tactics=svgMotions.selectAll(".tactics")
                        tactics=tactics.data(data_tactics);
                        tactics
                            .enter().append("rect")
                            .classed("tactics", true)
                            .classed("simultaneous",function(d){return d.state=="="})
                            .attr("x", xScale(0))
                            .attr("width", xScale(0))
                            .attr("y", function(d) { return yScale(d.phrase); })
                            .attr("height", yScale.bandwidth())
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(d.seq); })
                            .attr("width", function(d) {return xScale(.8); } )
                        tactics
                            .classed("simultaneous",function(d){return d.state=="="})
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(d.seq); })
                            .attr("width", function(d) {return xScale(.8); } )
                            .attr("y", function(d) { return yScale(d.phrase); })
                            .attr("height", yScale.bandwidth());
                        tactics.exit().remove();

                        var nodeBias=scope.data.nodeBias;          // bias of left part and right part of the nodes
                        var svgLeftParts = svgMotions.selectAll(".node_left").data(data_tactics);
                        var svgRightParts = svgMotions.selectAll(".node_right").data(data_tactics);
                        svgLeftParts.enter().append("rect")
                            .attr("class","node_left")
                            .attr("x", xScale(0))
                            .attr("width", xScale(0))
                            .attr("y", function(d) { return yScale(d.phrase); })
                            .attr("height", yScale.bandwidth())
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(d.seq); })
                            .attr("width", function(d) {return xScale(.8)*nodeBias[d.state].w1; } )
                        svgLeftParts
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(d.seq); })
                            .attr("width", function(d) {return xScale(.8)*nodeBias[d.state].w1; } )
                            .attr("y", function(d) { return yScale(d.phrase); })
                            .attr("height", yScale.bandwidth());
                        svgLeftParts.exit().remove();


                        svgRightParts.enter().append("rect")
                            .attr("class","node_right")
                            .attr("x", xScale(0))
                            .attr("width", xScale(0))
                            .attr("y", function(d) { return yScale(d.phrase); })
                            .attr("height", yScale.bandwidth())
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(d.seq)+xScale(.8)*(1-nodeBias[d.state].w2); })
                            .attr("width", function(d) {return xScale(.8)*nodeBias[d.state].w2; } )
                        svgRightParts
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) { return xScale(d.seq)+xScale(.8)*(1-nodeBias[d.state].w2); })
                            .attr("width", function(d) {return xScale(.8)*nodeBias[d.state].w2; } )
                            .attr("y", function(d) { return yScale(d.phrase); })
                            .attr("height", yScale.bandwidth());
                        svgRightParts.exit().remove();

                    }
                    function drawSteps(){
                        var steps1=[];
                        var steps2=[];

                        if(!scope.data.Show_motions){
                            phrases.forEach(function(d){
                                if(d.steps[0]==1){
                                    steps1.push({
                                        phrase:d.bout
                                        ,index:1
                                    })
                                }
                                else if(d.steps[0]==2){
                                    steps1.push({
                                        phrase:d.bout
                                        ,index:0
                                    })
                                    steps1.push({
                                        phrase:d.bout
                                        ,index:2
                                    })
                                }

                                if(d.steps[1]==1){
                                    steps2.push({
                                        phrase:d.bout
                                        ,index:1
                                    })
                                }
                                else if(d.steps[1]==2){
                                    steps2.push({
                                        phrase:d.bout
                                        ,index:0
                                    })
                                    steps2.push({
                                        phrase:d.bout
                                        ,index:2
                                    })
                                }
                            })

                        }
                        // steps
                        var svgSteps1 = svgMotions.selectAll(".node_step_1").data(steps1);
                        var step_r=yScale.bandwidth()/8;
                        svgSteps1
                            .enter().append("circle")
                            .classed("node_step_1", true)
                            .attr("cx", xScale(0))
                            .attr("cy", function(d) {return yScale(d.phrase)+step_r*2;})
                            .attr("r", 0)
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("cx", function(d) { return xScale(0.2*(d.index+1)); })
                            .attr("r", step_r);
                        svgSteps1
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("cx", function(d) { return xScale(0.2*(d.index+1)); })
                            .attr("cy", function(d) {return yScale(d.phrase)+step_r*2;})
                            .attr("r", step_r);
                        svgSteps1.exit().remove();


                        var svgSteps2 = svgMotions.selectAll(".node_step_2").data(steps2);
                        var step_r=yScale.bandwidth()/8;
                        svgSteps2
                            .enter().append("circle")
                            .classed("node_step_2", true)
                            .attr("cx", xScale(0))
                            .attr("cy", function(d) {return yScale(d.phrase)+step_r*6;})
                            .attr("r", 0)
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("cx", function(d) { return xScale(0.2*(d.index+1)); })
                            .attr("r", step_r);
                        svgSteps2
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("cx", function(d) { return xScale(0.2*(d.index+1)); })
                            .attr("cy", function(d) {return yScale(d.phrase)+step_r*6;})
                            .attr("r", step_r);
                        svgSteps2.exit().remove();
                    }
                    // draw attack positions
                    function drawPositions(){
                        var pos1=[];
                        var pos2=[];

                        if(!scope.data.Show_motions){
                            phrases.forEach(function(d){
                                d.states.forEach(function(s,i){
                                    if(s=="FF"){
                                        if(d.pos1.length>0){
                                            pos1.push({
                                                phrase:d.bout
                                                ,seq:i
                                                ,pos:d.pos1[d.pos1.length-1]
                                            });
                                        }
                                        if(d.pos2.length>0){
                                            pos2.push({
                                                phrase:d.bout
                                                ,seq:i
                                                ,pos:d.pos2[d.pos2.length-1]
                                            });
                                        }
                                    }

                                })
                            })

                        }
                        // steps
                        var svgPos1 = svgMotions.selectAll(".node_pos_1").data(pos1);
                        var svgPos2 = svgMotions.selectAll(".node_pos_2").data(pos2);

                        svgPos1
                            .enter().append("rect")
                            .attr("class", "node_pos_1")
                            .attr("x", xScale(0))
                            .attr("width", xScale(0))
                            .attr("y", function(d) {
                                var bias=0;
                                if(d.pos==3)
                                    bias=.7;
                                else if(d.pos==4)
                                    bias=.1;
                                else if(d.pos==5)
                                    bias=.4

                                return yScale(d.phrase)+yScale.bandwidth()*bias;
                            })
                            .attr("height", function(d){return yScale.bandwidth()*.2;})
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) {return xScale(d.seq+.2) } )
                            .attr("width", function(d) {return xScale(.2) } )
                        svgPos1
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) {return xScale(d.seq+.2) } )
                            .attr("width", function(d) {return xScale(.2) } )
                            .attr("stroke",function(d){return phraseColor(d)})
                            .attr("y", function(d) {
                                var bias=0;
                                if(d.pos==3)
                                    bias=.7;
                                else if(d.pos==4)
                                    bias=.1;
                                else if(d.pos==5)
                                    bias=.4

                                return yScale(d.phrase)+yScale.bandwidth()*bias;
                            })
                            .attr("height", function(d){return yScale.bandwidth()*.2;})
                        svgPos1.exit().remove();

                        svgPos2
                            .enter().append("rect")
                            .attr("class", "node_pos_2")
                            .attr("x", xScale(0))
                            .attr("width", xScale(0))
                            .attr("y", function(d) {
                                var bias=0;
                                if(d.pos==3)
                                    bias=.1;
                                else if(d.pos==4)
                                    bias=.7;
                                else if(d.pos==5)
                                    bias=.4

                                return yScale(d.phrase)+yScale.bandwidth()*bias;
                            })
                            .attr("height", function(d){return yScale.bandwidth()*.2;})
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) {return xScale(d.seq+.4) } )
                            .attr("width", function(d) {return xScale(.2) } )
                        svgPos2
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) {return xScale(d.seq+.4) } )
                            .attr("width", function(d) {return xScale(.2) } )
                            .attr("stroke",function(d){return phraseColor(d)})
                            .attr("y", function(d) {
                                var bias=0;
                                if(d.pos==3)
                                    bias=.1;
                                else if(d.pos==4)
                                    bias=.7;
                                else if(d.pos==5)
                                    bias=.4

                                return yScale(d.phrase)+yScale.bandwidth()*bias;
                            })
                            .attr("height", function(d){return yScale.bandwidth()*.2;})
                        svgPos2.exit().remove();


                        /*
                        svgPos1
                            .enter().append("text")
                            .classed("node_pos_1",true)
                            .text(function(d) { return d.pos; })
                            .attr("x", 0 )
                            .attr("y", function(d) {return yScale(d.phrase)+yScale.bandwidth()*.7;})
                            .attr("stroke",function(d){return phraseColor(d)})
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) {return xScale(d.seq+.2) } )

                        svgPos1
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) {return xScale(d.seq+.2) } )
                            .attr("y", function(d) {return yScale(d.phrase)+yScale.bandwidth()*.7;})
                            .text(function(d) { return d.pos; })
                            .attr("stroke",function(d){return phraseColor(d)})
                        svgPos1.exit().remove();

                        svgPos2
                            .enter().append("text")
                            .classed("node_pos_2",true)
                            .text(function(d) { return d.pos; })
                            .attr("x", 0 )
                            .attr("y", function(d) {return yScale(d.phrase)+yScale.bandwidth()*.7;})
                            .attr("stroke",function(d){return phraseColor(d)})
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) {return xScale(d.seq+.5) } )

                        svgPos2
                            .transition()           // apply a transition
                            .duration(500)         // apply it over 4000 milliseconds
                            .attr("x", function(d) {return xScale(d.seq+.5) } )
                            .attr("y", function(d) {return yScale(d.phrase)+yScale.bandwidth()*.7;})
                            .text(function(d) { return d.pos; })
                            .attr("stroke",function(d){return phraseColor(d)})
                        svgPos2.exit().remove();
                        */

                    }

                    drawPhrases();
                    drawResults();
                    drawFootworks();
                    drawBladeworks();
                    drawTactics();
                    drawSteps();
                    drawPositions();
                }

                var data_feet=scope.data.motion;
                var data_hands=scope.data.motion_hands;
                var phrases=scope.data.phrases
                var phrases_sorted=scope.data.Sort_phrases?scope.data.phrases_sorted:scope.data.phrases;

                var data_tactics=[];

                var yScale=d3.scaleBand();
                var xScale=d3.scaleLinear();


                // filtering
                var arrFilter=scope.data.filters;
                phrases=phrases.filter(function(d){return arrFilter[d.bout-1]==0})
                phrases_sorted=phrases_sorted.filter(function(d){return arrFilter[d.bout-1]==0})
                data_feet=data_feet.filter(function(d){return arrFilter[d.bout-1]==0})
                data_hands=data_hands.filter(function(d){return arrFilter[d.bout-1]==0})



                yScale = d3.scaleBand()
                    .domain(phrases_sorted.map(function(d) { return d.bout; }))
                    .range([0,svgMotionH])
                    .padding(0.1);

                if(scope.data.Show_motions){
                    xScale = d3.scaleLinear()
                        .domain([0, Math.max(d3.max(data_feet, function(d){ return d.bias_end; }),d3.max(data_hands, function(d){ return d.bias_end; }))])
                        .range([0, svgMotionW]);
                }
                else{
                    data_feet=[];
                    data_hands=[];

                    // generate the tactics nodes
                    phrases.forEach(function(d){
                        d.states.forEach(function(state,i){
                            data_tactics.push({
                                phrase:d.bout,
                                seq:i,
                                state:state
                            })
                        })
                    })

                    xScale = d3.scaleLinear()
                        .domain([0, d3.max(data_tactics, function(d){ return d.seq; })+2])
                        .range([0, svgMotionW])
                }
                // update axes
                gAxisX
                    .attr("transform", "translate(0," + -2 + ")")
                    .call(d3.axisTop(xScale))
                gAxisXBottom
                    .attr("transform", "translate(0," + svgMotionH + ")")
                    .call(d3.axisBottom(xScale))
                gAxisY
                    .attr("transform", "translate(-2,0)")
                    .call(d3.axisLeft(yScale));

                redrawMotions();
            }
            redraw();


            scope.$watch('data', redraw);
            scope.$watch('data.motion', redraw);
            scope.$watch('data.motion_hands', redraw);
            scope.$watch('data.filters', redraw);
            scope.$watch('data.focused_bout', redraw);
            scope.$watch('data.Show_motions', redraw);
            scope.$watch('data.Sort_phrases', redraw);
            scope.$watch('data.Show_all_motions', redraw);
        }
        motionChart();
    }
    return {
        link: link,
        restrict: 'E',
        scope: { data: '=' }
    };
});