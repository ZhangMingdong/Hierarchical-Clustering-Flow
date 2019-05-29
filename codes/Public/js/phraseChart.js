/*
    dsp: directive to show the animation of a phrase
    author: Mingdong
    logs:
        created
        2018/02/01
 */
mainApp.directive('phraseChart', function () {
    function link(scope, el, attr) {
        function phraseChart(){
            // 0.definition
            // coordinates of every critical point of the glyph for every motion
            var arrGlyphCoords=[
                [
                    {x:0,y:-30},
                    {x:0,y:-20},
                    {x:0,y:10},
                    {x:-20,y:0},
                    {x:-10,y:10},
                    {x:20,y:0},
                    {x:30,y:0},
                    {x:30,y:-40},       // sword tip
                    {x:-20,y:20},
                    {x:-20,y:40},
                    {x:20,y:20},
                    {x:25,y:40}
                ],  // en garde
                [
                    {x:8,y:-12},
                    {x:0,y:0},
                    {x:-10,y:10},
                    {x:-20,y:-20},
                    {x:-30,y:-30},
                    {x:20,y:0},
                    {x:30,y:0},
                    {x:90,y:0},      // sword tip
                    {x:-20,y:20},
                    {x:-40,y:40},
                    {x:20,y:10},
                    {x:30,y:40}
                ],  // lunge
                [
                    {x:-10,y:-30},
                    {x:-10,y:-20},
                    {x:-10,y:10},
                    {x:-30,y:0},
                    {x:-20,y:10},
                    {x:0,y:0},
                    {x:10,y:0},
                    {x:10,y:-40},      // sword tip
                    {x:-20,y:20},
                    {x:-30,y:40},
                    {x:10,y:20},
                    {x:15,y:40}
                ],  // parry
                [
                    {x:-10,y:-30},
                    {x:-10,y:-20},
                    {x:-10,y:10},
                    {x:-30,y:0},
                    {x:-20,y:10},
                    {x:10,y:-20},
                    {x:20,y:-20},
                    {x:80,y:-20},      // sword tip
                    {x:-20,y:20},
                    {x:-30,y:40},
                    {x:10,y:20},
                    {x:15,y:40}
                ]   // riposte
            ]


            var arrResults={

            }
            var bChinese=false;
            if(bChinese){
                arrResults={
                    a:"进攻反攻"
                    ,r:"防守还击"
                    ,b:"同时互中"
                }
            }
            else{
                arrResults={
                    a:"Attack - Counter-Attack"
                    ,r:"Parry & Riposte"
                    ,b:"Simultaneous Attack"

                }
            }

            // map motion to index
            function mapMotion(motion){
                if(motion=="a") return 1;
                else if(motion=="r") return 3;
                else return 0;
            }


            function generatePositionSequence(seq,right){
                var result=[];
                var direct=right? 1:-1;
                seq.forEach(function(d){
                    result.push(7+direct*d);
                })
                return result;
            }
            function generateP1Sequence(seq){
                return generatePositionSequence(seq,0);
            }
            function generateP2Sequence(seq){
                return generatePositionSequence(seq,1);

            }

            // radius of the head
            var radius_head=9;

            // 0.1.size
            var margin = {top: 20, right: 20, bottom: 20, left: 20};
            var svgBGW=0;
            var svgBGH=0;
            var svgW = 0;
            var svgH = 0;

            // 1.Add DOM elements
            var svgBG = d3.select(el[0]).append("svg").attr("width",svgBGW).attr("height",svgBGH);
            var svg=svgBG.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // 1.1.fencers
            var svgFencer1=svg.append("g")
                .style("opacity", 0)
            var svgFencer2=svg.append("g")
                .style("opacity", 0)
            // 1.2.results
            var svgResultText=svg.append("text")
                .classed("result",true)
                .style("opacity", 0)
            // 1.3.parts of fencers
            var svgHeadFencer1=svgFencer1.append("circle")
                .classed("fencerhead1",true)
                .attr("r", 9)
            var svgBodyFencer1=svgFencer1.append("line")
                .classed("fencer1",true)
                .classed("body",true)
            // left arm
            var svgLA1Fencer1=svgFencer1.append("line")
                .classed("fencer1",true)
                .classed("body",true)
            var svgLA2Fencer1=svgFencer1.append("line")
                .classed("fencer1",true)
                .classed("body",true)
            // right arm
            var svgRA1Fencer1=svgFencer1.append("line")
                .classed("fencer1",true)
                .classed("body",true)
            var svgRA2Fencer1=svgFencer1.append("line")
                .classed("fencer1",true)
                .classed("body",true)
            // sabre
            var svgSabreFencer1=svgFencer1.append("line")
                .classed("fencer1",true)
                .classed("sword",true)
            // left legs
            var svgLL1Fencer1=svgFencer1.append("line")
                .classed("fencer1",true)
                .classed("body",true)
            var svgLL2Fencer1=svgFencer1.append("line")
                .classed("fencer1",true)
                .classed("body",true)
            // right legs
            var svgRL1Fencer1=svgFencer1.append("line")
                .classed("fencer1",true)
                .classed("body",true)
            var svgRL2Fencer1=svgFencer1.append("line")
                .classed("fencer1",true)
                .classed("body",true)
            var svgHeadFencer2=svgFencer2.append("circle")
                .classed("fencerhead2",true)
                .attr("r", 9)
            var svgBodyFencer2=svgFencer2.append("line")
                .classed("fencer2",true)
                .classed("body",true)
            // left arm
            var svgLA1Fencer2=svgFencer2.append("line")
                .classed("fencer2",true)
                .classed("body",true)
            var svgLA2Fencer2=svgFencer2.append("line")
                .classed("fencer2",true)
                .classed("body",true)
            // right arm
            var svgRA1Fencer2=svgFencer2.append("line")
                .classed("fencer2",true)
                .classed("body",true)
            var svgRA2Fencer2=svgFencer2.append("line")
                .classed("fencer2",true)
                .classed("body",true)
            // sabre
            var svgSabreFencer2=svgFencer2.append("line")
                .classed("fencer2",true)
                .classed("sword",true)
            // left legs
            var svgLL1Fencer2=svgFencer2.append("line")
                .classed("fencer2",true)
                .classed("body",true)
            var svgLL2Fencer2=svgFencer2.append("line")
                .classed("fencer2",true)
                .classed("body",true)
            // right legs
            var svgRL1Fencer2=svgFencer2.append("line")
                .classed("fencer2",true)
                .classed("body",true)
            var svgRL2Fencer2=svgFencer2.append("line")
                .classed("fencer2",true)
                .classed("body",true)

            // 1.4.svg element arrays of two fencers
            var arrSVGFencer=[
                [
                    svgHeadFencer1,
                    svgBodyFencer1,
                    svgLA1Fencer1,
                    svgLA2Fencer1,
                    svgRA1Fencer1,
                    svgRA2Fencer1,
                    svgSabreFencer1,
                    svgLL1Fencer1,
                    svgLL2Fencer1,
                    svgRL1Fencer1,
                    svgRL2Fencer1
                ],
                [
                    svgHeadFencer2,
                    svgBodyFencer2,
                    svgLA1Fencer2,
                    svgLA2Fencer2,
                    svgRA1Fencer2,
                    svgRA2Fencer2,
                    svgSabreFencer2,
                    svgLL1Fencer2,
                    svgLL2Fencer2,
                    svgRL1Fencer2,
                    svgRL2Fencer2
                ]
            ]

            // 1.5.indices of glyphs
            var arrGlyphIndices=[
                [0,0],
                [1,2],
                [1,3],
                [3,4],
                [1,5],
                [5,6],
                [6,7],
                [2,8],
                [8,9],
                [2,10],
                [10,11],
            ]

            // 1.6.axes
            var gAxisT=svg.append("g")
            var gAxisB=svg.append("g")

            // width of the piste
            var pisteWidth=10;

            // scales
            var yScale = d3.scaleBand().domain([0,pisteWidth])
            var xScale = d3.scaleLinear().domain([0, 14])

            scope.$watch(function () {
                //    console.log("watching===============svgStreamBG")
                svgBGW = el[0].clientWidth;
                svgBGH = el[0].clientHeight;

                if(svgBGH<100) svgBGH=100;

                return svgBGW + svgBGH;
            }, resize);
            // response the size-change
            function resize() {
                //    console.log("====================resize motion chart=================");
                svgW = svgBGW - margin.left - margin.right;
                svgH = svgBGH - margin.top - margin.bottom;

                svgBG
                    .attr("width", svgBGW)
                    .attr("height", svgBGH)

                svg
                    .attr("width", svgW)
                    .attr("height", svgH)


                redraw();
            }
            function redraw(){
                // 1.update scales
                yScale.range([0,svgH])
                xScale.range([0, svgW]);

                // 2.update axes
                gAxisT
                    .attr("transform", "translate(0," + -2 + ")")
                    .call(d3.axisTop(xScale));
                gAxisB
                    .attr("transform", "translate(0," + svgH + ")")
                    .call(d3.axisBottom(xScale))


                // 3.lines
                var lineData=[0,2,5,7,9,12,14];
                var lines=svg.selectAll(".line").data(lineData);
                lines
                    .enter().append("line")
                    .attr("class", "line")
                    .attr("x1", function(d) { return xScale(d); })
                    .attr("x2", function(d) { return xScale(d); })
                    .attr("y1", function(d) { return 0; })
                    .attr("y2", function(d) { return svgH; })
                    .attr("stroke","black")
                lines
                    .attr("x1", function(d) { return xScale(d); })
                    .attr("x2", function(d) { return xScale(d); })
                    .attr("y1", function(d) { return 0; })
                    .attr("y2", function(d) { return svgH; })
                    .attr("stroke","black")
                lines.exit().remove();

                // 4.rectangles
                var rectData=[
                    {
                        x:0,
                        w:2
                    }
                    ,
                    {
                        x:12,
                        w:2
                    }
                ]

                var rects=svg.selectAll(".rect").data(rectData);
                rects.enter().append("rect")
                    .classed("rect",true)
                    .attr("x", function(d) { return xScale(d.x); })
                    .attr("y", function(d) { return yScale(0); })
                    .attr("width", function(d) { return xScale(d.w); })
                    .attr("height", function(d) { return svgH; })
                rects
                    .attr("x", function(d) { return xScale(d.x); })
                    .attr("y", function(d) { return yScale(0); })
                    .attr("width", function(d) { return xScale(d.w); })
                    .attr("height", function(d) { return svgH; })
                rects.exit().remove();

                // radius of the head
                radius_head=svgH/9;
                svg.selectAll("circle").attr("r",radius_head);
            }
            redraw();
            // position sequence
            var arrPositionSequence={
                attack:[2.5,2,1.5,.2]
                ,attack1:[2.5,1.8,.2]       // one step attack
                ,drawback2:[2.5,2,1.2,2.5]  // two step drawback
                ,drawback1:[2.5,1.5,2.5]    // one step drawback
                ,riposte:[2.5,2,1.0,.8,.4]
                ,drawback2:[2.5,2,1.2,2]  // two step draw back
                ,anti_riposte:[2.5,2,1.5,.5,.8,.5]
            }
            // motion sequence
            var arrMotionSequence={
                attack:[0,0,0,1,1]
                ,riposte:[0,0,0,2,3]
                ,anti_riposte:[0,0,0,1,2,3]
            }
            // show the animation of a phrase
            function showPhrase(){
            //    console.log("show phrase");
                if(scope.data.selected_phrase<0) return;
                // length of steps
                var stepLen=0;
                // array of positions
                var arrPos1=[];
                var arrPos2=[];
                // array of motions
                var arrMotion1=[];
                var arrMotion2=[];
                // array of durations
                var duration=500;
                var arrTime1=[duration,duration,duration,duration,duration,duration,duration,duration,duration,duration];
                var arrTime2=[duration,duration,duration,duration,duration,duration,duration,duration,duration,duration];

                // result text
                var resultText=""

                // get the phrase
                var phrase=scope.data.phrases[scope.data.selected_phrase-1];

                if(phrase.result=="b"){
                    arrPos1=generateP1Sequence(arrPositionSequence.attack)
                    arrPos2=generateP2Sequence(arrPositionSequence.attack)
                    arrMotion1=arrMotionSequence.attack;
                    arrMotion2=arrMotionSequence.attack;
                    resultText=arrResults[phrase.result];
                    stepLen=4;
                }
                else if(phrase.result=="r"){
                    if(scope.data.exchange){
                        arrPos1=generateP1Sequence(arrPositionSequence.riposte)
                        arrPos2=generateP2Sequence(arrPositionSequence.attack)
                        arrMotion1=arrMotionSequence.riposte;
                        arrMotion2=arrMotionSequence.attack;
                    }
                    else{
                        arrPos1=generateP1Sequence(arrPositionSequence.attack)
                        arrPos2=generateP2Sequence(arrPositionSequence.riposte)
                        arrMotion1=arrMotionSequence.attack;
                        arrMotion2=arrMotionSequence.riposte;

                    }
                    resultText="防守还击"
                    stepLen=5;
                }
                else if(phrase.result=="rr"){
                    if(scope.data.exchange){
                        arrPos1=generateP1Sequence(arrPositionSequence.riposte)
                        arrPos2=generateP2Sequence(arrPositionSequence.anti_riposte)
                        arrMotion1=arrMotionSequence.riposte;
                        arrMotion2=arrMotionSequence.anti_riposte;
                    }
                    else{
                        arrPos1=generateP1Sequence(arrPositionSequence.anti_riposte)
                        arrPos2=generateP2Sequence(arrPositionSequence.riposte)
                        arrMotion1=arrMotionSequence.anti_riposte;
                        arrMotion2=arrMotionSequence.riposte;
                    }
                    resultText="反还击"
                    stepLen=6;

                }
                else if(phrase.result=="a1"){
                    arrPos1=[4.5,5,5.5,6,7.5];
                    arrPos2=[9.5,9,8.5,8.2,8.5];
                    arrMotion1=[0,0,0,0,1];
                    arrMotion2=[0,0,0,0,2];
                    resultText="进攻反攻"
                }
                else if(phrase.result=="a3"){
                    arrPos1=[4.5,5,5.5,6,7,8,9.5];
                    arrPos2=[9.5,9,8.5,8.2,8.5,9.5,10.5];
                    arrMotion1=[0,0,0,0,0,0,1];
                    arrMotion2=[0,0,0,0,0,0,2];
                    resultText="进攻反攻"
                }
                else if(phrase.result=="a"){
                    arrPos1=generateP1Sequence(arrPositionSequence.attack)
                    arrPos2=generateP2Sequence(arrPositionSequence.attack)
                    arrMotion1=arrMotionSequence.attack;
                    arrMotion2=arrMotionSequence.attack;
                    resultText="进攻反攻"
                    stepLen=4;
                }
                else if(phrase.result=="ra"){
                    arrPos1=[4.5,5,5.5,6,7,8,9.5,9,8];
                    arrPos2=[9.5,9,8.5,8.2,8.5,9.5,11,10.8,9];
                    arrMotion1=[0,0,0,0,0,0,1,0,2];
                    arrMotion2=[0,0,0,0,0,0,2,0,1];
                    resultText="进攻反攻"
                    stepLen=9;
                }
                else{
                    return;
                }

                var arrTime=[arrTime1,arrTime2]
                var arrMotion=[arrMotion1,arrMotion2]
                var arrPos=[arrPos1,arrPos2];
                animation1();
                animation2();
                // elements
                for(var i=0;i<11;i++){
                    animationPart(1,i,arrGlyphIndices[i][0],arrGlyphIndices[i][1])
                    animationPart(2,i,arrGlyphIndices[i][0],arrGlyphIndices[i][1])
                }

                // animation of fencer1
                function animation1(){
                    var index=1;
                    svgFencer1
                        .style("opacity", 1)
                        .attr("transform", "translate("+xScale(arrPos1[0])+", "+svgH/2+")")
                        .transition()           // apply a transition
                        .duration(arrTime1[0])         // apply it over 4000 milliseconds
                        .on("start", function repeat() {
                            if(index==stepLen){
                                svgFencer1.style("opacity", 0)
                                svgResultText
                                    .text(resultText)
                                    .attr("x",xScale(7))
                                    .attr("y",svgH/2)
                                    .style("opacity",1)
                                    .transition()           // apply a transition
                                    .duration(1000)         // apply it over 4000 milliseconds
                                    .style("opacity",0)
                            }
                            else{
                                var pos=index<arrPos1.length?arrPos1[index]:arrPos1[arrPos1.length-1];
                                var time=index<arrTime1.length?arrTime1[index]:arrTime1[arrTime1.length-1];
                                index++;
                                d3.active(this)
                                    .attr("transform", "translate("+xScale(pos)+", "+svgH/2+")")
                                    .transition()
                                    .duration(time)
                                    .on("start", repeat);
                            }
                        });
                }
                // fencer2
                function animation2(){

                    var index=1;
                    svgFencer2
                        .style("opacity", 1)
                        .attr("transform", "translate("+xScale(arrPos2[0])+", "+svgH/2+")")
                        .transition()           // apply a transition
                        .duration(arrTime2[0])         // apply it over 4000 milliseconds
                        .on("start", function repeat() {
                            if(index==stepLen){
                                svgFencer2.style("opacity", 0)
                            }
                            else{
                                var pos=index<arrPos2.length?arrPos2[index]:arrPos2[arrPos2.length-1];
                                var time=index<arrTime2.length?arrTime2[index]:arrTime2[arrTime2.length-1];
                                index++;
                                d3.active(this)
                                    .attr("transform", "translate("+xScale(pos)+", "+svgH/2+")")
                                    .transition()
                                    .duration(time)
                                    .on("start", repeat);
                            }
                        });
                }
                // animation functions for each part
                // player: 1,2
                // indexPart: index of the part of the body
                // index1,index2: two indices of the critical point
                function animationPart(player,indexPart,index1,index2){
                    var revert=player==2?-1:1;
                    var index=1;
                    if(indexPart==0){
                        arrSVGFencer[player-1][indexPart]
                            .attr("cx",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][0].x*revert)
                            .attr("cy",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][0].y)
                            .transition()           // apply a transition
                            .duration(arrTime[player-1][0])         // apply it over 4000 milliseconds
                            .on("start", function repeat() {
                                if(index<stepLen){
                                    var playerMotion=arrMotion[player-1]
                                    var motion=index<playerMotion.length?playerMotion[index]:playerMotion[playerMotion.length-1];
                                    var playerTime=arrTime[player-1]
                                    var time=index<playerTime.length?playerTime[index]:playerTime[playerTime.length-1]
                                    index++;
                                    d3.active(this)
                                        .attr("cx",svgH/81*arrGlyphCoords[motion][0].x*revert)
                                        .attr("cy",svgH/81*arrGlyphCoords[motion][0].y)
                                        .transition()
                                        .duration(time)         // apply it over 4000 milliseconds
                                        .on("start", repeat);
                                }
                            });
                    }
                    else{
                        arrSVGFencer[player-1][indexPart]
                            .attr("x1",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index1].x*revert)
                            .attr("y1",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index1].y)
                            .attr("x2",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index2].x*revert)
                            .attr("y2",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index2].y)
                            .transition()           // apply a transition
                            .duration(arrTime[player-1][0])         // apply it over 4000 milliseconds
                            .on("start", function repeat() {
                                if(index<arrMotion[player-1].length){
                                    d3.active(this)
                                        .attr("x1",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index1].x*revert)
                                        .attr("y1",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index1].y)
                                        .attr("x2",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index2].x*revert)
                                        .attr("y2",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index2].y)
                                        .transition()
                                        .duration(arrTime[player-1][index++])         // apply it over 4000 milliseconds
                                        .on("start", repeat);
                                }
                            });

                    }
                }
            }

            // 2nd version of show bout, using the sequence instead of patterns
            function showPhrase_2(){
                //    console.log("show phrase");
                if(scope.data.selected_phrase<0) return;
                // length of steps
                var stepLen1=1;
                var stepLen2=1;
                // array of positions
                var arrPos1=[];
                var arrPos2=[];
                // array of motions
                var arrMotion1=[];
                var arrMotion2=[];
                // array of durations
                var duration=500;
                var arrTime1=[duration,duration,duration,duration,duration,duration,duration,duration,duration,duration];
                var arrTime2=[duration,duration,duration,duration,duration,duration,duration,duration,duration,duration];

                // result text
                var resultText=""

                // get the phrase
                var phrase=scope.data.phrases[scope.data.selected_phrase-1];

                // scale of frame to duration
                var frameScale=100;
                console.log(phrase.feet1.length,phrase.feet2.length);
                // for the short phrases
                if(phrase.feet1.length<4 && phrase.feet2.length<4){
                    // 1.length
                    stepLen1=phrase.feet1.length+1;
                    stepLen2=phrase.feet2.length+1;
                    // 2.time
                    arrTime1=[];
                    arrTime2=[];
                    var bias_start=0;
                    phrase.feet1.forEach(function(d){
                        arrTime1.push((d.bias_end-bias_start)*frameScale)
                        bias_start=d.bias_end;
                    })
                    arrTime1.push(duration);

                    bias_start=0;
                    phrase.feet2.forEach(function(d){
                        arrTime2.push((d.bias_end-bias_start)*frameScale)
                        bias_start=d.bias_end;
                    })
                    arrTime2.push(duration);
                    // 3.position
                    if(stepLen1==3) {
                        if(phrase.feet1[phrase.feet1.length-1].type=="a")
                            arrPos1=generateP1Sequence(arrPositionSequence.attack1)
                        else
                            arrPos1=generateP1Sequence(arrPositionSequence.drawback1)
                    }
                    else if(stepLen1==4) {
                        if(phrase.feet1[phrase.feet1.length-1].type=="a")
                            arrPos1=generateP1Sequence(arrPositionSequence.attack)
                        else
                            arrPos1=generateP1Sequence(arrPositionSequence.drawback2)
                    }

                    if(stepLen2==3) {
                        if(phrase.feet2[phrase.feet2.length-1].type=="a")
                            arrPos2=generateP2Sequence(arrPositionSequence.attack1)
                        else
                            arrPos2=generateP2Sequence(arrPositionSequence.drawback1)
                    }
                    else if(stepLen2==4) {
                        if(phrase.feet2[phrase.feet2.length-1].type=="a")
                            arrPos2=generateP2Sequence(arrPositionSequence.attack)
                        else
                            arrPos2=generateP2Sequence(arrPositionSequence.drawback2)
                    }

                    // 4.motion
                    arrMotion1=[0];
                    arrMotion2=[0];
                    phrase.feet1.forEach(function(d){arrMotion1.push(mapMotion(d.type))})
                    arrMotion1.push(arrMotion1[stepLen1-2]);
                    phrase.feet2.forEach(function(d){arrMotion2.push(mapMotion(d.type))})
                    arrMotion2.push(arrMotion1[stepLen2-2]);
                    if(phrase.result=="a")
                        resultText="进攻反攻"
                    else if(phrase.result=="b")
                        resultText=arrResults[phrase.result];
                    else if(phrase.result=="r")
                        resultText="防守还击"

                }



                var arrTime=[arrTime1,arrTime2]
                var arrMotion=[arrMotion1,arrMotion2]
                var arrPos=[arrPos1,arrPos2];
                animation1();
                animation2();
                // elements
                for(var i=0;i<11;i++){
                    animationPart(1,i,arrGlyphIndices[i][0],arrGlyphIndices[i][1],stepLen1)
                    animationPart(2,i,arrGlyphIndices[i][0],arrGlyphIndices[i][1],stepLen2)
                }

                // animation of fencer1
                function animation1(){
                    var index=1;
                    svgFencer1
                        .style("opacity", 1)
                        .attr("transform", "translate("+xScale(arrPos1[0])+", "+svgH/2+")")
                        .transition()           // apply a transition
                        .duration(arrTime1[0])         // apply it over 4000 milliseconds
                        .on("start", function repeat() {
                            if(index==stepLen1){
                                svgFencer1.style("opacity", 0)
                                svgResultText
                                    .text(resultText)
                                    .attr("x",xScale(7))
                                    .attr("y",svgH/2)
                                    .style("opacity",1)
                                    .transition()           // apply a transition
                                    .duration(1000)         // apply it over 4000 milliseconds
                                    .delay(0)
                                    .style("opacity",0)
                            }
                            else{
                                var pos=index<arrPos1.length?arrPos1[index]:arrPos1[arrPos1.length-1];
                                var time=index<arrTime1.length?arrTime1[index]:arrTime1[arrTime1.length-1];
                                index++;
                                d3.active(this)
                                    .attr("transform", "translate("+xScale(pos)+", "+svgH/2+")")
                                    .transition()
                                    .duration(time)
                                    .on("start", repeat);
                            }
                        });
                }
                // fencer2
                function animation2(){
                    console.log(stepLen2);
                    var index=1;
                    svgFencer2
                        .style("opacity", 1)
                        .attr("transform", "translate("+xScale(arrPos2[0])+", "+svgH/2+")")
                        .transition()           // apply a transition
                        .duration(arrTime2[0])         // apply it over 4000 milliseconds
                        .on("start", function repeat() {
                            if(index==stepLen2){
                                svgFencer2.style("opacity", 0)
                            }
                            else{
                                var pos=index<arrPos2.length?arrPos2[index]:arrPos2[arrPos2.length-1];
                                var time=index<arrTime2.length?arrTime2[index]:arrTime2[arrTime2.length-1];
                                index++;
                                d3.active(this)
                                    .attr("transform", "translate("+xScale(pos)+", "+svgH/2+")")
                                    .transition()
                                    .duration(time)
                                    .on("start", repeat);
                            }
                        });
                }
                // animation functions for each part
                // player: 1,2
                // indexPart: index of the part of the body
                // index1,index2: two indices of the critical point
                function animationPart(player,indexPart,index1,index2,stepLen){
                    var revert=player==2?-1:1;
                    var index=1;
                    if(indexPart==0){
                        arrSVGFencer[player-1][indexPart]
                            .attr("cx",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][0].x*revert)
                            .attr("cy",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][0].y)
                            .transition()           // apply a transition
                            .duration(arrTime[player-1][0])         // apply it over 4000 milliseconds
                            .on("start", function repeat() {
                                if(index<stepLen){
                                    var playerMotion=arrMotion[player-1]
                                    var motion=index<playerMotion.length?playerMotion[index]:playerMotion[playerMotion.length-1];
                                    var playerTime=arrTime[player-1]
                                    var time=index<playerTime.length?playerTime[index]:playerTime[playerTime.length-1]
                                    index++;
                                    d3.active(this)
                                        .attr("cx",svgH/81*arrGlyphCoords[motion][0].x*revert)
                                        .attr("cy",svgH/81*arrGlyphCoords[motion][0].y)
                                        .transition()
                                        .duration(time)         // apply it over 4000 milliseconds
                                        .on("start", repeat);
                                }
                            });
                    }
                    else{
                        arrSVGFencer[player-1][indexPart]
                            .attr("x1",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index1].x*revert)
                            .attr("y1",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index1].y)
                            .attr("x2",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index2].x*revert)
                            .attr("y2",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index2].y)
                            .transition()           // apply a transition
                            .duration(arrTime[player-1][0])         // apply it over 4000 milliseconds
                            .on("start", function repeat() {
                                if(index<arrMotion[player-1].length){
                                    d3.active(this)
                                        .attr("x1",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index1].x*revert)
                                        .attr("y1",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index1].y)
                                        .attr("x2",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index2].x*revert)
                                        .attr("y2",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index2].y)
                                        .transition()
                                        .duration(arrTime[player-1][index++])         // apply it over 4000 milliseconds
                                        .on("start", repeat);
                                }
                            });

                    }
                }
            }

            // 3rd version, handle case beside a and b
            function showPhrase_3(){
                //    console.log("show phrase");
                if(scope.data.selected_phrase<0) return;
                // length of steps
                var stepLen1=1;
                var stepLen2=1;
                // array of positions
                var arrPos1=[];
                var arrPos2=[];
                // array of motions
                var arrMotion1=[];
                var arrMotion2=[];
                // array of durations
                var duration=500;
                var arrTime1=[duration,duration,duration,duration,duration,duration,duration,duration,duration,duration];
                var arrTime2=[duration,duration,duration,duration,duration,duration,duration,duration,duration,duration];

                // result text
                var resultText=""

                // get the phrase
                var phrase=scope.data.phrases[scope.data.selected_phrase-1];

                // scale of frame to duration
                var frameScale=50;

                // for the short phrases
                if(phrase.feet1.length<4 && phrase.feet2.length<4){
                    // 1.length
                    stepLen1=phrase.feet1.length+1;
                    stepLen2=phrase.feet2.length+1;
                    // 2.time
                    arrTime1=[];
                    arrTime2=[];
                    var bias_start=0;
                    phrase.feet1.forEach(function(d){
                        arrTime1.push((d.bias_end-bias_start)*frameScale)
                        bias_start=d.bias_end;
                    })
                    arrTime1.push(duration);

                    bias_start=0;
                    phrase.feet2.forEach(function(d){
                        arrTime2.push((d.bias_end-bias_start)*frameScale)
                        bias_start=d.bias_end;
                    })
                    arrTime2.push(duration);
                    // 3.position
                    function generatePositionArray(feet,right){
                        var result=[];
                        if(feet[feet.length-1].type=="a"){
                            if(feet.length==2)
                                result=generatePositionSequence(arrPositionSequence.attack1,right)
                            else if(feet.length==3)
                                result=generatePositionSequence(arrPositionSequence.attack,right)
                        }
                        else if(feet[feet.length-1].type=="b"){
                            if(feet.length==2)
                                result=generatePositionSequence(arrPositionSequence.drawback1,right)
                            else if(feet.length==3)
                                result=generatePositionSequence(arrPositionSequence.drawback2,right)
                        }
                        else if(feet[feet.length-1].type=="r"){
                            result=generatePositionSequence(arrPositionSequence.riposte,right);
                        }
                        return result;
                    }
                    arrPos1=generatePositionArray(phrase.feet1,0);
                    arrPos2=generatePositionArray(phrase.feet2,1);

                    // 4.motion
                    arrMotion1=[0];
                    arrMotion2=[0];
                    phrase.feet1.forEach(function(d){arrMotion1.push(mapMotion(d.type))})
                    arrMotion1.push(arrMotion1[stepLen1-2]);
                    phrase.feet2.forEach(function(d){arrMotion2.push(mapMotion(d.type))})
                    arrMotion2.push(arrMotion1[stepLen2-2]);
                    if(phrase.result=="a")
                        resultText=arrResults[phrase.result];
                    else if(phrase.result=="b")
                        resultText=arrResults[phrase.result];
                    else if(phrase.result=="r"){
                        if(phrase.feet1[phrase.feet1.length-1].type=="b"){
                            arrMotion1[arrMotion1.length-2]=mapMotion("r")
                        }
                        else{
                            arrMotion2[arrMotion2.length-2]=mapMotion("r")
                        }

                        resultText=arrResults[phrase.result];
                    }
                    console.log(arrMotion1);
                }

                var durationSum1=0;
                var durationSum2=0;
                arrTime1.forEach(function(d){durationSum1+=d;})
                arrTime2.forEach(function(d){durationSum2+=d;})
                var durationSum=Math.max(durationSum1,durationSum2);
                var arrPhraseTime=[durationSum,duration];

                var arrTime=[arrTime1,arrTime2]
                var arrMotion=[arrMotion1,arrMotion2]
                var arrPos=[arrPos1,arrPos2];

                animationPhrase();
                animation1();
                animation2();
                // elements
                for(var i=0;i<11;i++){
                    animationPart(1,i,arrGlyphIndices[i][0],arrGlyphIndices[i][1],stepLen1)
                    animationPart(2,i,arrGlyphIndices[i][0],arrGlyphIndices[i][1],stepLen2)
                }

                // animation of the phrase.
                // step1.hide fencers, and show text
                // step2.hide text
                function animationPhrase(){
                    svgResultText
                        .transition()
                        .duration(0)
                        .delay(durationSum)
                        .text(resultText)
                        .attr("x",xScale(7))
                        .attr("y",svgH/2)
                        .style("opacity",1)
                        .on("start",function(d){
                            svgFencer1.style("opacity", 0)
                            svgFencer2.style("opacity", 0)
                        })
                        .transition()           // apply a transition
                        .duration(1000)         // apply it over 4000 milliseconds
                        .delay(0)
                        .style("opacity",0)

                }
                // animation of position of fencer1
                function animation1(){
                    var index=1;
                    svgFencer1
                        .style("opacity", 1)
                        .attr("transform", "translate("+xScale(arrPos1[0])+", "+svgH/2+")")
                        .transition()
                        .duration(arrTime1[0])
                        .on("start", function repeat() {
                            if(index<stepLen1){
                                var pos=index<arrPos1.length?arrPos1[index]:arrPos1[arrPos1.length-1];
                                var time=index<arrTime1.length?arrTime1[index]:arrTime1[arrTime1.length-1];
                                index++;
                                d3.active(this)
                                    .attr("transform", "translate("+xScale(pos)+", "+svgH/2+")")
                                    .transition()
                                    .duration(time)
                                    .on("start", repeat);
                            }
                        });
                }
                // animation of fencer2
                function animation2(){
                    console.log(stepLen2);
                    var index=1;
                    svgFencer2
                        .style("opacity", 1)
                        .attr("transform", "translate("+xScale(arrPos2[0])+", "+svgH/2+")")
                        .transition()           // apply a transition
                        .duration(arrTime2[0])         // apply it over 4000 milliseconds
                        .on("start", function repeat() {
                            if(index<stepLen2){
                                var pos=index<arrPos2.length?arrPos2[index]:arrPos2[arrPos2.length-1];
                                var time=index<arrTime2.length?arrTime2[index]:arrTime2[arrTime2.length-1];
                                index++;
                                d3.active(this)
                                    .attr("transform", "translate("+xScale(pos)+", "+svgH/2+")")
                                    .transition()
                                    .duration(time)
                                    .on("start", repeat);
                            }
                        });
                }
                // animation functions for each part
                // player: 1,2
                // indexPart: index of the part of the body
                // index1,index2: two indices of the critical point
                function animationPart(player,indexPart,index1,index2,stepLen){
                    var revert=player==2?-1:1;
                    var index=1;
                    if(indexPart==0){
                        arrSVGFencer[player-1][indexPart]
                            .attr("cx",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][0].x*revert)
                            .attr("cy",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][0].y)
                            .transition()           // apply a transition
                            .duration(arrTime[player-1][0])         // apply it over 4000 milliseconds
                            .on("start", function repeat() {
                                if(index<stepLen){
                                    var playerMotion=arrMotion[player-1]
                                    var motion=index<playerMotion.length?playerMotion[index]:playerMotion[playerMotion.length-1];
                                    var playerTime=arrTime[player-1]
                                    var time=index<playerTime.length?playerTime[index]:playerTime[playerTime.length-1]
                                    index++;
                                    d3.active(this)
                                        .attr("cx",svgH/81*arrGlyphCoords[motion][0].x*revert)
                                        .attr("cy",svgH/81*arrGlyphCoords[motion][0].y)
                                        .transition()
                                        .duration(time)         // apply it over 4000 milliseconds
                                        .on("start", repeat);
                                }
                            });
                    }
                    else{
                        arrSVGFencer[player-1][indexPart]
                            .attr("x1",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index1].x*revert)
                            .attr("y1",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index1].y)
                            .attr("x2",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index2].x*revert)
                            .attr("y2",svgH/81*arrGlyphCoords[arrMotion[player-1][0]][index2].y)
                            .transition()           // apply a transition
                            .duration(arrTime[player-1][0])         // apply it over 4000 milliseconds
                            .on("start", function repeat() {
                                if(index<stepLen){
                                    d3.active(this)
                                        .attr("x1",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index1].x*revert)
                                        .attr("y1",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index1].y)
                                        .attr("x2",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index2].x*revert)
                                        .attr("y2",svgH/81*arrGlyphCoords[arrMotion[player-1][index]][index2].y)
                                        .transition()
                                        .duration(arrTime[player-1][index++])         // apply it over 4000 milliseconds
                                        .on("start", repeat);
                                }
                            });

                    }
                }
            }


            scope.$watch('data', redraw);
            scope.$watch('data.show_phrase', showPhrase_3);
            //scope.$watch('data.selected_phrase', showPhrase_2);
        }
        phraseChart();
    }
    return {
        link: link,
        restrict: 'E',
        scope: { data: '=' }
    };
});