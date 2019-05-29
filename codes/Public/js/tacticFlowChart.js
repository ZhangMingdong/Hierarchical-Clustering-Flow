/*
    dsp: directive to show tactic flow of a bout
    author: Mingdong
    logs:
        created
        2018/02/10
 */
mainApp.directive('tacticFlowChart', function () {
    function link(scope, el, attr) {
        function tacticFlowChart(){
            // 0.definition

            // 0.1.size
            var margin = {top: 0, right: 0, bottom: 0, left: 0};
            var svgBGW=1000;
            var svgBGH=800;
            var svgW = svgBGW - margin.left - margin.right;
            var svgH = svgBGH - margin.top - margin.bottom;

            // 1.Add DOM elements
            var svgBG = d3.select(el[0]).append("svg").attr("width",svgBGW).attr("height",svgBGH);
            var svg=svgBG.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            scope.$watch(function () {
                //    console.log("watching===============svgStreamBG")
                svgBGW = el[0].clientWidth;
                svgBGH = el[0].clientHeight;

                if(svgBGW<600) svgBGW=600;
                if(svgBGH<400) svgBGH=400;

                return svgBGW + svgBGH;
            }, resize);



            // response the size-change
            function resize(){
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
                if(scope.data.flow_groups.length==0) return;
                // 1.definitions
                var radius_node=0.055*svgH;//30;         // radius of nodes
                var flowRange=radius_node*2;//60;           // range of the flow width
                var middleX=svgW/2;         // middle of the view
                var middleY=svgH/2;         // middle of the view in Y
                //var spanY=110;              // X span
                //var spanX=110;              // Y span
                var spanY=(svgH-radius_node*3)/4;              // X span
                var spanX=(svgH-radius_node*3)/4;              // Y span
                var nodeBias=scope.data.nodeBias;          // bias of left part and right part of the nodes
                var nodes=[]                // data of nodes
                var lines=[]                // data of lines

                // map x and y to svg
                function mapX(d){return middleX+d.x*spanX;}
                function mapY(d){return middleY+d.y*spanY;}

                // flow and mapping
                var flow=scope.data.flow;
                var focused_flow=scope.data.focused_flow;
                var flow_groups=scope.data.flow_groups;
                var selected_flow=scope.data.selected_flow;

                // calculate max count
                var max_count=20;
                for(var d in flow){
                    while(max_count<flow[d]) max_count+=5;
                }


                function getFlow_width(d){
                    return flowRange*flow[d.name]/max_count;
                }
                function getFlow_focused(d){
                    return focused_flow[d.name]>0;}
                function getFlow_width_selected(d){
                    return flowRange*selected_flow[d.name]/max_count;}
                function getFlow_group_width(d,group){
                    return flowRange*flow_groups[group][d.name]/max_count;}

                // draw orthogonal layout
                function drawOrthogonal(){
                    // 0.build the graph
                    nodes=[
                         {x:+0,y:-2,name:"FF"}  //0
                        ,{x:-1,y:-1,name:"FB"}  //1
                        ,{x:+0,y:-1,name:"BB"}  //2
                        ,{x:+1,y:-1,name:"BF"}  //3
                        ,{x:-2,y:+0,name:"1" }  //4
                        ,{x:-1,y:+0,name:"BF"}  //5
                        ,{x:+0,y:+0,name:"S" }  //6
                        ,{x:+1,y:+0,name:"FB"}  //7
                        ,{x:+2,y:+0,name:"2" }  //8
                        ,{x:-1,y:+1,name:"2" }  //9
                        ,{x:+0,y:+1,name:"FF"}  //10
                        ,{x:+1,y:+1,name:"1" }  //11
                        ,{x:+0,y:+2,name:"=" }  //12
                    ]
                    lines=[
                         {s:6,d:2,name:"sbb"}      //0    S-BB
                        ,{s:6,d:7,name:"sfb"}      //1    S-FB
                        ,{s:6,d:10,name:"sff"}      //2    S-FF
                        ,{s:6,d:5,name:"sbf"}      //3    S-BF
                        ,{s:2,d:1,name:"bbfb"}      //4    BB-FB
                        ,{s:2,d:0,name:"bbff"}      //5    BB-FF
                        ,{s:2,d:3,name:"bbbf"}      //6    BB-BF
                        ,{s:7,d:11,name:"fb1"}      //7    FBF
                        ,{s:7,d:8,name:"fb2"}      //8    FBR\FBA
                        ,{s:10,d:11,name:"ff1"}      //9    FF1
                        ,{s:10,d:12,name:"ffb"}      //10   FFB
                        ,{s:10,d:9,name:"ff2"}      //11   FF2
                        ,{s:5,d:4,name:"bf1"}      //12   BFR\BFA
                        ,{s:5,d:9,name:"bf2"}      //13   BFF
                        ,{s:7,d:3,name:"fbb"}      //14   FBB
                        ,{s:5,d:1,name:"bfb"}      //15   BFB
                        ,{s:2,d:2,name:"fbfb"}      //16   FBFB
                        ,{s:4,d:4,name:"bfbf"}      //17   BFBF
                    ]

                    // 2.draw links
                    drawLinks(funLine);

                    // function to generate the path
                    // link: the binded link
                    // part: the part 1,2
                    function funLine(link,part) {
                        var indexS=link.s;
                        var indexD=link.d;
                        var path;
                        var s={x:mapX(nodes[indexS]),y:mapY(nodes[indexS])}
                        var d={x:mapX(nodes[indexD]),y:mapY(nodes[indexD])}
                        // adjust the parts
                        if(part!=undefined){
                            var bias=-getFlow_width(link)/2;
                            for(var i=0;i<part;i++) bias+=getFlow_group_width(link,i);
                            bias+=getFlow_group_width(link,part)/2;
                            if(s.x==d.x){
                                s.x+=bias;
                                d.x+=bias;
                            }
                            else{
                                s.y+=bias;
                                d.y+=bias;
                            }
                    }

                        // adjust the node radius
                        if(s.x==d.x){
                            if(s.y>d.y){
                                s.y-=radius_node;
                                d.y+=radius_node;
                            }
                            else if(s.y<d.y){
                                s.y+=radius_node;
                                d.y-=radius_node;
                            }
                        }
                        else{
                            if(s.x>d.x){
                                s.x-=radius_node;
                                d.x+=radius_node;
                            }
                            else{
                                s.x+=radius_node;
                                d.x-=radius_node;
                            }
                        }
                        path = `M ${s.x} ${s.y}
                                L  ${d.x} ${d.y}`

                        return path
                    }


                }

                // draw common layout
                function drawCommon(){
                    // variables used in diagonal
                    var biasEarW=spanY*.5;//60;
                    var biasEarH=spanY*.5;//60;
                    var biasTopW=spanY*.7;//80;
                    var biasTopH=spanY*1.3;//150;
                    var biasBottomW=spanY*.9;//100;
                    var biasBottomH=spanY*.9;//200;
                    var topBias=spanY*2.4;//280;
                    var bottomBias=spanY*2.4;//280;

                    lines=[
                        {s:0,d:1,name:"sbb"}      //0    S-BB
                        ,{s:0,d:2,name:"sfb"}      //1    S-FB
                        ,{s:0,d:3,name:"sff"}      //2    S-FF
                        ,{s:0,d:4,name:"sbf"}      //3    S-BF
                        ,{s:1,d:2,name:"bbfb"}      //4    BB-FB
                        ,{s:1,d:3,name:"bbff"}      //5    BB-FF
                        ,{s:1,d:4,name:"bbbf"}      //6    BB-BF
                        ,{s:2,d:5,name:"fb1"}      //7    FBF
                        ,{s:2,d:7,name:"fb2"}      //8    FBR\FBA
                        ,{s:3,d:5,name:"ff1"}      //9    FF1
                        ,{s:3,d:6,name:"ffb"}      //10   FFB
                        ,{s:3,d:7,name:"ff2"}      //11   FF2
                        ,{s:4,d:5,name:"bf1"}      //12   BFR\BFA
                        ,{s:4,d:7,name:"bf2"}      //13   BFF
                        ,{s:2,d:4,name:"fbb"}      //14   FBB
                        ,{s:4,d:2,name:"bfb"}      //15   BFB
                        ,{s:2,d:2,name:"fbfb"}      //16   FBFB
                        ,{s:4,d:4,name:"bfbf"}      //17   BFBF
                    ]
                    // Switch Position
                    if (scope.data.Switch_pos){
                        switchFlow(lines,1,3);
                        switchFlow(lines,4,6);
                        switchFlow(lines,7,13);
                        switchFlow(lines,8,12);
                        switchFlow(lines,9,11);
                        switchFlow(lines,14,15);
                        switchFlow(lines,16,17);
                    }

                    function drawAsymmetric(){
                        nodes=[
                            {x:-0.5 ,y:-1.7, name:"S" }
                            ,{x:+0.5 ,y:-1.7, name:"BB"}
                            ,{x:+2.0 ,y:-0.2,name:"FB"}
                            ,{x:-2.0 ,y:-0.2,name:"FF"}
                            ,{x:-0.0 ,y:-0.2,name:"BF"}
                            ,{x:+2.0 ,y:+1.2,name:"1" }
                            ,{x:-2.0 ,y:+1.2,name:"=" }
                            ,{x:-0.0 ,y:+1.2,name:"2" }
                        ]
                        function diagonal(link) {
                            var indexS=link.s;
                            var indexD=link.d;

                            var path;
                            if(indexS==0&&indexD==1){
                                var s={x:mapX(nodes[indexS])+radius_node,y:mapY(nodes[indexS])}
                                var d={x:mapX(nodes[indexD])-radius_node,y:mapY(nodes[indexD])}
                                path = `M ${s.x} ${s.y}
                                L  ${d.x} ${d.y}`

                            }//S-BB
                            else if(indexS==4&&indexD==2){
                                var s={x:mapX(nodes[indexS])+radius_node,y:mapY(nodes[indexS])+radius_node/2}
                                var d={x:mapX(nodes[indexD])-radius_node,y:mapY(nodes[indexD])+radius_node/2}
                                path = `M ${s.x} ${s.y}
                                        L  ${d.x} ${d.y}`

                            }//BFB
                            else if(indexS==2&&indexD==4){
                                var s={x:mapX(nodes[indexS])+radius_node,y:mapY(nodes[indexS])-radius_node/2}
                                var d={x:mapX(nodes[indexD])-radius_node,y:mapY(nodes[indexD])-radius_node/2}
                                path = `M ${s.x} ${s.y}
                                        L  ${d.x} ${d.y}`

                            }//FBB
                            else if(indexS==4&&indexD==4){
                                var x=mapX(nodes[indexS]);
                                var y=mapY(nodes[indexS]);
                                path = `M ${x         } ${y+radius_node}
                                C ${x         } ${y+biasEarH},
                                  ${x-biasEarW} ${y+biasEarH},
                                  ${x-biasEarW} ${y}
                                C ${x-biasEarW} ${y-biasEarH},
                                  ${x         } ${y-biasEarH},
                                  ${x         } ${y-radius_node}`
                            }//BFBF
                            else if(indexS==2&&indexD==2){
                                var x=mapX(nodes[indexS]);
                                var y=mapY(nodes[indexS]);
                                path = `M ${x         } ${y+radius_node}
                                C ${x         } ${y+biasEarH},
                                  ${x+biasEarW} ${y+biasEarH},
                                  ${x+biasEarW} ${y}
                                C ${x+biasEarW} ${y-biasEarH},
                                  ${x         } ${y-biasEarH},
                                  ${x         } ${y-radius_node}`
                            }//FBFB
                            else{
                                var s={x:mapX(nodes[indexS]),y:mapY(nodes[indexS])+radius_node}
                                var d={x:mapX(nodes[indexD]),y:mapY(nodes[indexD])-radius_node}
                                path = `M ${s.x} ${s.y}
                                C ${s.x} ${(s.y + d.y) / 2},
                                  ${d.x} ${(s.y + d.y) / 2},
                                  ${d.x} ${d.y}`
                            }
                            return path
                        }

                        drawTube(diagonal);
                        drawLinks(diagonal);
                    }

                    function drawSymmetric(){
                        nodes=[
                            {x:-0.5 ,y:-1.7, name:"S" }
                            ,{x:+0.5 ,y:-1.7, name:"BB"}
                            ,{x:+2.0 ,y:-0.2,name:"FB"}
                            ,{x:+0.0 ,y:-0.2,name:"FF"}
                            ,{x:-2.0 ,y:-0.2,name:"BF"}
                            ,{x:+2.0 ,y:+1.2,name:"1" }
                            ,{x:+0.0 ,y:+1.2,name:"=" }
                            ,{x:-2.0 ,y:+1.2,name:"2" }
                        ]
                        function diagonal(link) {
                            var indexS=link.s;
                            var indexD=link.d;

                            var path;
                            if(indexS==0&&indexD==1){
                                var s={x:mapX(nodes[indexS])+radius_node,y:mapY(nodes[indexS])}
                                var d={x:mapX(nodes[indexD])-radius_node,y:mapY(nodes[indexD])}
                                path = `M ${s.x} ${s.y}
                                L  ${d.x} ${d.y}`

                            }//S-BB
                            else if(indexS==4&&indexD==2){
                                var s={x:mapX(nodes[indexS]),y:mapY(nodes[indexS])-radius_node}
                                var d={x:mapX(nodes[indexD]),y:mapY(nodes[indexD])-radius_node}
                                path = `M ${s.x} ${s.y}
                                C ${s.x} ${s.y-topBias},
                                  ${d.x} ${d.y-topBias},
                                  ${d.x} ${d.y}`

                            }//BFB
                            else if(indexS==2&&indexD==4){
                                var s={x:mapX(nodes[indexS])+radius_node,y:mapY(nodes[indexS])}
                                var d={x:mapX(nodes[indexD])-radius_node,y:mapY(nodes[indexD])}
                                path = `M ${s.x                 } ${s.y}
                                C ${s.x+biasBottomW     } ${s.y},
                                  ${s.x+biasBottomW     } ${s.y+bottomBias},
                                  ${(s.x+d.x)/2         } ${s.y+bottomBias}
                                C ${d.x-biasBottomW     } ${d.y+bottomBias},
                                  ${d.x-biasBottomW     } ${d.y},
                                  ${d.x                 } ${d.y}`

                            }//FBB
                            else if(indexS==4&&indexD==4){
                                var x=mapX(nodes[indexS]);
                                var y=mapY(nodes[indexS]);
                                path = `M ${x         } ${y+radius_node}
                                C ${x         } ${y+biasEarH},
                                  ${x-biasEarW} ${y+biasEarH},
                                  ${x-biasEarW} ${y}
                                C ${x-biasEarW} ${y-biasEarH},
                                  ${x         } ${y-biasEarH},
                                  ${x         } ${y-radius_node}`
                            }//BFBF
                            else if(indexS==2&&indexD==2){
                                var x=mapX(nodes[indexS]);
                                var y=mapY(nodes[indexS]);
                                path = `M ${x         } ${y+radius_node}
                                C ${x         } ${y+biasEarH},
                                  ${x+biasEarW} ${y+biasEarH},
                                  ${x+biasEarW} ${y}
                                C ${x+biasEarW} ${y-biasEarH},
                                  ${x         } ${y-biasEarH},
                                  ${x         } ${y-radius_node}`
                            }//FBFB
                            else{
                                var s={x:mapX(nodes[indexS]),y:mapY(nodes[indexS])+radius_node}
                                var d={x:mapX(nodes[indexD]),y:mapY(nodes[indexD])-radius_node}
                                path = `M ${s.x} ${s.y}
                                C ${s.x} ${(s.y + d.y) / 2},
                                  ${d.x} ${(s.y + d.y) / 2},
                                  ${d.x} ${d.y}`
                            }
                            return path
                        }

                        drawTube(diagonal);
                        drawLinks(diagonal);
                    }

                    if(scope.data.asymmetric) drawAsymmetric();
                    else drawSymmetric();

                    function drawTube(diagonal){
                        var svgLinkTube = svg.selectAll(".linktube").data(scope.data.Show_tube?lines:[]);
                        svgLinkTube.enter().insert('path', "g")
                            .attr("class", "linktube")
                            .attr('d', function(d){
                                return diagonal(d)
                            })
                        svgLinkTube
                            .attr('d', function(d){
                                return diagonal(d)
                            })
                        svgLinkTube.exit().remove();
                    }


                    // 3.for players
                    var flow_player1=scope.data.flow_player1;
                    var flow_player2=scope.data.flow_player2;
                    if(flow_player1.b)
                    {
                        var nodes1=[
                            {x:-4.0   ,y:-1.6,name:"S"}
                            ,{x:-4.5   ,y:+0.0,name:"B"}
                            ,{x:-3.5   ,y:+0.0,name:"F"}
                            ,{x:-4.8   ,y:+1.6,name:"1"}
                            ,{x:-4.0   ,y:+1.6,name:"B"}
                            ,{x:-3.2   ,y:+1.6,name:"2"}
                        ]
                        var nodes2=[
                            {x:+4.00   ,y:-1.6,name:"S"}
                            ,{x:+4.50  ,y:+0.0,name:"B"}
                            ,{x:+3.50  ,y:+0.0,name:"F"}
                            ,{x:+4.80  ,y:+1.6,name:"1"}
                            ,{x:+4.00  ,y:+1.6,name:"B"}
                            ,{x:+3.20  ,y:+1.6,name:"2"}
                        ]
                        var lines1=[
                            {s:0,d:1,width:flow_player1.b, w1:0,w2:0,selectedw:0,focused:false,name:"b"}
                            ,{s:0,d:2,width:flow_player1.f, w1:0,w2:0,selectedw:0,focused:false,name:"f"}
                            ,{s:1,d:3,width:flow_player1.b1,w1:0,w2:0,selectedw:0,focused:false,name:"b1"}
                            ,{s:1,d:4,width:flow_player1.bb,w1:0,w2:0,selectedw:0,focused:false,name:"bb"}
                            ,{s:1,d:5,width:flow_player1.b2,w1:0,w2:0,selectedw:0,focused:false,name:"b2"}
                            ,{s:2,d:3,width:flow_player1.f1,w1:0,w2:0,selectedw:0,focused:false,name:"f1"}
                            ,{s:2,d:4,width:flow_player1.fb,w1:0,w2:0,selectedw:0,focused:false,name:"fb"}
                            ,{s:2,d:5,width:flow_player1.f2,w1:0,w2:0,selectedw:0,focused:false,name:"f2"}
                        ]
                        var lines2=[
                            {s:0,d:1,width:flow_player2.b, w1:0,w2:0,selectedw:0,focused:false,name:"b"}
                            ,{s:0,d:2,width:flow_player2.f, w1:0,w2:0,selectedw:0,focused:false,name:"f"}
                            ,{s:1,d:3,width:flow_player2.b1,w1:0,w2:0,selectedw:0,focused:false,name:"b1"}
                            ,{s:1,d:4,width:flow_player2.bb,w1:0,w2:0,selectedw:0,focused:false,name:"bb"}
                            ,{s:1,d:5,width:flow_player2.b2,w1:0,w2:0,selectedw:0,focused:false,name:"b2"}
                            ,{s:2,d:3,width:flow_player2.f1,w1:0,w2:0,selectedw:0,focused:false,name:"f1"}
                            ,{s:2,d:4,width:flow_player2.fb,w1:0,w2:0,selectedw:0,focused:false,name:"fb"}
                            ,{s:2,d:5,width:flow_player2.f2,w1:0,w2:0,selectedw:0,focused:false,name:"f2"}
                        ]
                        if(!scope.data.Show_individual){
                            nodes1=[];
                            nodes2=[];
                            lines1=[];
                            lines2=[];
                        }
                        else{
                            max_count=flow_player1.b+flow_player1.f;
                        }
                        function playerDiagnal(nodeS,nodeD){
                            var s={x:nodeS.x,y:nodeS.y+r}
                            var d={x:nodeD.x,y:nodeD.y-r}
                            var path = `M ${s.x} ${s.y}
                                C ${s.x} ${(s.y + d.y) / 2},
                                  ${d.x} ${(s.y + d.y) / 2},
                                  ${d.x} ${d.y}`
                            return path;
                        }
                        var svgNodes1 = svg.selectAll(".node1").data(nodes1);
                        svgNodes1.enter().append("rect")
                            .attr("class","node1")
                            .attr("width",function(d){return r*2;})
                            .attr("height",function(d){return r*2;})
                            .attr("x",function(d){return d.x-r})
                            .attr("y",function(d){return d.y-r})
                        svgNodes1
                            .attr("width",function(d){return r*2;})
                            .attr("height",function(d){return r*2;})
                            .attr("x",function(d){return d.x-r})
                            .attr("y",function(d){return d.y-r})
                        svgNodes1.exit().remove();

                        var svgLinkplayer1 = svg.selectAll(".linkplayer1").data(lines1);
                        svgLinkplayer1.enter().append('path', "g")
                            .attr("class", "linkplayer1")
                            .attr('d', function(d){
                                return playerDiagnal(nodes1[d.s], nodes1[d.d])
                            })
                            .style("stroke-width", function(d){return d.width})
                        svgLinkplayer1
                            .attr('d', function(d){
                                return playerDiagnal(nodes1[d.s], nodes1[d.d])
                            })
                            .style("stroke-width", function(d){return d.width})
                        svgLinkplayer1.exit().remove();


                        var svgNodes2 = svg.selectAll(".node2").data(nodes2);
                        svgNodes2.enter().append("rect")
                            .attr("class","node2")
                            .attr("width",function(d){return r*2;})
                            .attr("height",function(d){return r*2;})
                            .attr("x",function(d){return d.x-r})
                            .attr("y",function(d){return d.y-r})
                        svgNodes2
                            .attr("width",function(d){return r*2;})
                            .attr("height",function(d){return r*2;})
                            .attr("x",function(d){return d.x-r})
                            .attr("y",function(d){return d.y-r})
                        svgNodes2.exit().remove();

                        var svgLinkplayer2 = svg.selectAll(".linkplayer2").data(lines2);
                        svgLinkplayer2.enter().append('path', "g")
                            .attr("class", "linkplayer2")
                            .attr('d', function(d){
                                return playerDiagnal(nodes2[d.s], nodes2[d.d])
                            })
                            .style("stroke-width", function(d){return d.width})
                        svgLinkplayer2
                            .attr('d', function(d){
                                return playerDiagnal(nodes2[d.s], nodes2[d.d])
                            })
                            .style("stroke-width", function(d){return d.width})
                        svgLinkplayer2.exit().remove();


                        var svgText1 = svg.selectAll(".text1").data(nodes1);
                        svgText1.enter()
                            .append("text")
                            .attr("class", "text1")
                            .text(function(d){return d.name})
                            .attr("x", function(d) {
                                return d.x;
                            })
                            .attr("y", function(d) {
                                return d.y+r/2;
                            })
                        svgText1
                            .text(function(d){return d.name})
                            .attr("x", function(d) {
                                return d.x;
                            })
                            .attr("y", function(d) {
                                return d.y+r/2;
                            })

                        svgText1.exit().remove();

                        var svgText2 = svg.selectAll(".text2").data(nodes2);
                        svgText2.enter()
                            .append("text")
                            .attr("class", "text2")
                            .text(function(d){return d.name})
                            .attr("x", function(d) {
                                return d.x;
                            })
                            .attr("y", function(d) {
                                return d.y+r/2;
                            })
                        svgText2
                            .text(function(d){return d.name})
                            .attr("x", function(d) {
                                return d.x;
                            })
                            .attr("y", function(d) {
                                return d.y+r/2;
                            })

                        svgText2.exit().remove();
                    }
                //    console.log(JSON.stringify(nodes))
                //    console.log(JSON.stringify(lines))
                //    console.log(JSON.stringify(flow))

                }

                // draw the matrix of attack position
                function drawAttackPos(){
                    var data=[];
                    var text=[];
                    if(scope.data.selected_node=="FF"){
                        data=[
                            {x:0,y:0,s1:0,s2:0,s:0}
                            ,{x:1,y:0,s1:0,s2:0,s:0}
                            ,{x:2,y:0,s1:0,s2:0,s:0}
                            ,{x:0,y:1,s1:0,s2:0,s:0}
                            ,{x:1,y:1,s1:0,s2:0,s:0}
                            ,{x:2,y:1,s1:0,s2:0,s:0}
                            ,{x:0,y:2,s1:0,s2:0,s:0}
                            ,{x:1,y:2,s1:0,s2:0,s:0}
                            ,{x:2,y:2,s1:0,s2:0,s:0}
                        ]
                        scope.data.selected_phrases.forEach(function(d){
                            console.log(d)
                            var pos1=d.pos1[d.pos1.length-1];
                            var pos2=d.pos2[d.pos2.length-1];
                            var index=(pos2-3)*3+(pos1-3);
                            console.log(index);
                            if(d.score==1) data[index].s1++;
                            else if(d.score==2) data[index].s2++;
                            else data[index].s++;
                        })

                        text=[
                            {x:0,y:-.5,name:"3"}
                            ,{x:1,y:-.5,name:"4"}
                            ,{x:2,y:-.5,name:"5"}
                            ,{x:-.5,y:0.1,name:"3"}
                            ,{x:-.5,y:1.1,name:"4"}
                            ,{x:-.5,y:2.1,name:"5"}
                        ]
                    }
                    var svgNodes = svg.selectAll(".node_pos").data(data);

                    // 1.nodes

                    var x0=40;
                    var y0=50;
                    var r=3;
                    var scale=50;
                    svgNodes.enter().append("circle")
                        .attr("class","node_pos")
                        .attr("r",function(d){return r*(d.s1+d.s2+d.s);})
                        .attr("cx",function(d){return x0+d.x*scale})
                        .attr("cy",function(d){return y0+d.y*scale})
                    svgNodes
                        .attr("r",function(d){return r*(d.s1+d.s2+d.s);})
                        .attr("cx",function(d){return x0+d.x*scale})
                        .attr("cy",function(d){return y0+d.y*scale})
                    svgNodes.exit().remove();


                    var svgText = svg.selectAll(".text_pos").data(text);
                    svgText.enter()
                        .append("text")
                        .attr("class","text_pos")
                        .text(function(d){return d.name})
                        .attr("x",function(d){return x0+d.x*scale})
                        .attr("y",function(d){return y0+d.y*scale})
                    svgText
                        .text(function(d){return d.name})
                        .attr("x",function(d){return x0+d.x*scale})
                        .attr("y",function(d){return y0+d.y*scale})

                    svgText.exit().remove();


                }

                // draw the matrix of attack steps
                function drawAttackSteps(){
                    var data=[];
                    var text=[];
                    if(scope.data.selected_node=="FF"){
                        data=[
                            {x:0,y:0,s1:0,s2:0,s:0}
                            ,{x:1,y:0,s1:0,s2:0,s:0}
                            ,{x:0,y:1,s1:0,s2:0,s:0}
                            ,{x:1,y:1,s1:0,s2:0,s:0}
                        ]

                        scope.data.selected_phrases.forEach(function(d){
                            var steps1=0;
                            var steps2=0;
                            var forward=true;
                            d.feet1.forEach(function(md){
                                if(md.type=='f' && forward) steps1++;
                                else forward=false;
                            })
                            forward=true;
                            d.feet2.forEach(function(md){
                                if(md.type=='f' && forward) steps2++;
                                else forward=false;
                            })
                            var index=(steps2-1)*2+steps1-1;
                            if(d.score==1) data[index].s1++;
                            else if(d.score==2) data[index].s2++;
                            else data[index].s++;
                        })

                        text=[
                            {x:0,y:-.5,name:"1"}
                            ,{x:1,y:-.5,name:"2"}
                            ,{x:-.5,y:0.1,name:"1"}
                            ,{x:-.5,y:1.1,name:"2"}
                        ]
                    }
                    var svgNodes = svg.selectAll(".node_step").data(data);

                    // 1.nodes
                    var x0=40;
                    var y0=svgH-100;
                    var r=3;
                    var scale=50;
                    svgNodes.enter().append("circle")
                        .attr("class","node_step")
                        .attr("r",function(d){return r*(d.s1+d.s2+d.s);})
                        .attr("cx",function(d){return x0+d.x*scale})
                        .attr("cy",function(d){return y0+d.y*scale})
                    svgNodes
                        .attr("r",function(d){return r*(d.s1+d.s2+d.s);})
                        .attr("cx",function(d){return x0+d.x*scale})
                        .attr("cy",function(d){return y0+d.y*scale})
                    svgNodes.exit().remove();


                    var svgText = svg.selectAll(".text_step").data(text);
                    svgText.enter()
                        .append("text")
                        .attr("class","text_step")
                        .text(function(d){return d.name})
                        .attr("x",function(d){return x0+d.x*scale})
                        .attr("y",function(d){return y0+d.y*scale})
                    svgText
                        .text(function(d){return d.name})
                        .attr("x",function(d){return x0+d.x*scale})
                        .attr("y",function(d){return y0+d.y*scale})

                    svgText.exit().remove();

                }
                // draw the nodes: node, leftpart, rightpart, text
                function drawNodes(){
                    var svgNodes = svg.selectAll(".node").data(nodes);

                    // 1.nodes
                    /*
                    svgNodes.enter().append("circle")
                        .attr("class","node")
                        .attr("r",function(d){return r;})
                        .attr("cx",function(d){return d.x})
                        .attr("cy",function(d){return d.y})
                        */
                    svgNodes.enter().append("rect")
                        .attr("class","node")
                        .classed("simultaneous",function(d){return d.name=="="})
                        .attr("width",function(d){return radius_node*2;})
                        .attr("height",function(d){return radius_node*2;})
                        .attr("x",function(d){return mapX(d)-radius_node})
                        .attr("y",function(d){return mapY(d)-radius_node})
                        .on('mouseover', function (d) {
                            //console.log("mouse over");
                            scope.$apply(function(){
                                scope.data.onSelectedFlowNode(d, redraw);
                            });
                        })
                        .on('mouseleave', function (d) {
                            // console.log("mouse leave");
                            scope.data.onUnSelectedFlowNode();
                            redraw();
                        })
                    svgNodes
                        .classed("selected",function(d){
                            return d.name==scope.data.selected_node;
                        })
                        .classed("simultaneous",function(d){return d.name=="="})
                        .attr("width",function(d){return radius_node*2;})
                        .attr("height",function(d){return radius_node*2;})
                        .attr("x",function(d){return mapX(d)-radius_node})
                        .attr("y",function(d){return mapY(d)-radius_node})
                    svgNodes.exit().remove();


                    var svgLeftParts = svg.selectAll(".node_left").data(nodes);
                    var svgRightParts = svg.selectAll(".node_right").data(nodes);
                    svgLeftParts.enter().append("rect")
                        .attr("class","node_left")
                        .attr("width",function(d){return radius_node*2*nodeBias[d.name].w1;})
                        .attr("height",function(d){return radius_node*2;})
                        .attr("x",function(d){return mapX(d)-radius_node})
                        .attr("y",function(d){return mapY(d)-radius_node})
                        .on('mouseover', function (d) {
                            // console.log("mouse over");
                            scope.$apply(function(){
                                scope.data.onSelectedFlowNode(d, redraw);
                            });
                        })
                        .on('mouseleave', function (d) {
                            // console.log("mouse leave");
                            scope.data.onUnSelectedFlowNode();
                            redraw();
                        })
                    svgLeftParts
                        .attr("width",function(d){return radius_node*2*nodeBias[d.name].w1;})
                        .attr("height",function(d){return radius_node*2;})
                        .attr("x",function(d){return mapX(d)-radius_node})
                        .attr("y",function(d){return mapY(d)-radius_node})
                    svgLeftParts.exit().remove();


                    svgRightParts.enter().append("rect")
                        .attr("class","node_right")
                        .attr("width",function(d){return radius_node*2*nodeBias[d.name].w2;})
                        .attr("height",function(d){return radius_node*2;})
                        .attr("x",function(d){return mapX(d)+radius_node-radius_node*2*nodeBias[d.name].w2})
                        .attr("y",function(d){return mapY(d)-radius_node})
                        .on('mouseover', function (d) {
                            // console.log("mouse over");
                            scope.$apply(function(){
                                scope.data.onSelectedFlowNode(d, redraw);
                            });
                        })
                        .on('mouseleave', function (d) {
                            // console.log("mouse leave");
                            scope.data.onUnSelectedFlowNode();
                            redraw();
                        })
                    svgRightParts
                        .attr("width",function(d){return radius_node*2*nodeBias[d.name].w2;})
                        .attr("height",function(d){return radius_node*2;})
                        .attr("x",function(d){return mapX(d)+radius_node-radius_node*2*nodeBias[d.name].w2})
                        .attr("y",function(d){return mapY(d)-radius_node})
                    svgRightParts.exit().remove();


                    var labels=[];
                    if(scope.data.Show_node_label)
                        nodes.forEach(function(d){labels.push(d);});
                    var svgText = svg.selectAll(".text").data(labels);
                    svgText.enter()
                        .append("text")
                        .attr("class","text")
                        .text(function(d){return d.name})
                        .attr("x",function(d){return mapX(d)})
                        .attr("y",function(d){return mapY(d)+radius_node/2})
                    svgText
                        .text(function(d){return d.name})
                        .attr("x",function(d){return mapX(d)})
                        .attr("y",function(d){return mapY(d)+radius_node/2})

                    svgText.exit().remove();
                }

                // draw links of the graph
                function drawLinks(funPath){
                    var colorScale = d3.scaleOrdinal(d3["schemeCategory10"]);
                    // 1.links
                    var svgLink = svg.selectAll(".link").data(lines);
                    svgLink.enter().append('path', "g")
                        .attr("class", "link")
                        .attr('d', function(d){return funPath(d)})
                        .style("stroke-width", function(d){return scope.data.Sum_flow?getFlow_width(d):0})
                        .on('mouseenter', function (d) {
                        //    console.log("mouse over");
                            scope.data.onSelectedFlow(d, redraw);
                            redraw();

                        })
                        .on('mouseleave', function (d) {
                        //    console.log("mouse leave");
                            scope.data.onUnSelectedFlow();
                            redraw();
                        })
                    svgLink
                        .attr('d', function(d){return funPath(d)})
                        .style("stroke-width", function(d){return scope.data.Sum_flow?getFlow_width(d):0})
                    svgLink.exit().remove();

                    // 2.focused links
                    var svgFocusedLink = svg.selectAll(".linkfocused").data(lines);
                    svgFocusedLink.enter().append('path', "g")
                        .attr("class", "linkfocused")
                        .attr('d', function(d){return funPath(d)})
                        .style("stroke-width", function(d){return scope.data.Sum_flow&&getFlow_focused(d)? flowRange/max_count:0})
                    svgFocusedLink
                        .attr('d', function(d){return funPath(d)})
                        .style("stroke-width", function(d){return scope.data.Sum_flow&&getFlow_focused(d)? flowRange/max_count:0})
                    svgFocusedLink.exit().remove();

                    // 3.two parts
                    for(var i=0;i<flow_groups.length;i++){
                        var svgLink1 = svg.selectAll(".link"+i).data(lines);
                        svgLink1.enter().append('path', "g")
                            .attr("class", "link"+i)
                            .attr('d', function(d){return funPath(d,i)})
                            .style("stroke-width", function(d){return scope.data.Sum_flow?0:getFlow_group_width(d,i);})
                            .style("stroke",colorScale(i))
                        svgLink1
                            .attr('d', function(d){return funPath(d,i)})
                            .style("stroke-width", function(d){return scope.data.Sum_flow?0:getFlow_group_width(d,i);})
                            .style("stroke",colorScale(i))
                        svgLink1.exit().remove();

                    }


                    // 4.selected
                    var svgLinkSelected = svg.selectAll(".linkselected").data(lines);
                    svgLinkSelected.enter().append('path', "g")
                        .attr("class", "linkselected")
                        .attr('d', function(d){return funPath(d)})
                        .style("stroke-width", function(d){ return scope.data.Sum_flow?getFlow_width_selected(d):0;});
                    svgLinkSelected
                        .attr('d', function(d){return funPath(d)})
                        .style("stroke-width", function(d){ return scope.data.Sum_flow?getFlow_width_selected(d):0;});
                    svgLinkSelected.exit().remove();
                }

                // draw the background, should be called before other rendering
                function drawBG(){
                    var arrCircles=[
                        {level:1,r:spanY*0.5},
                        {level:2,r:spanY*1.1},
                        {level:3,r:spanY*2.3}
                    ]

                    var svgCircle = svg.selectAll(".bg").data(arrCircles);

                    svgCircle.enter().append("circle")
                        .attr("class","bg")
                        .attr("r",function(d){return d.r;})
                        .attr("cx",function(d){return middleX})
                        .attr("cy",function(d){return middleY})
                        .style("fill","yellow")
                        .style("opacity",.2)
                    svgCircle
                        .attr("r",function(d){return d.r;})
                        .attr("cx",function(d){return middleX})
                        .attr("cy",function(d){return middleY})
                        .style("fill","yellow")
                        .style("opacity",.3)
                        .style("visibility",function(d){return scope.data.orthogonal? "visible":"hidden"})
                    svgCircle.exit().remove();
                }

                // switch element in the array of index1 and index 2
                function switchFlow(arr,index1,index2){
                    var s=arr[index1].s;
                    var d=arr[index1].d;
                    arr[index1].s=arr[index2].s;
                    arr[index1].d=arr[index2].d;
                    arr[index2].s=s;
                    arr[index2].d=d;
                }

                // 2.draw
                //drawBG();
                if(scope.data.orthogonal){
                    drawOrthogonal();
                }
                else{
                    drawCommon();
                }

                drawNodes();
                drawAttackPos();
                drawAttackSteps();
            }

            redraw();

            scope.$watch('data', redraw);
            scope.$watch('data.flow', redraw);
            scope.$watch('data.focused_flow', redraw);
            scope.$watch('data.Sum_flow', redraw);
            scope.$watch('data.Switch_pos', redraw);
            scope.$watch('data.Show_tube', redraw);
            scope.$watch('data.orthogonal', redraw);
            scope.$watch('data.asymmetric', redraw);
            scope.$watch('data.Show_individual', redraw);
            scope.$watch('data.Show_node_label', redraw);
        }
        tacticFlowChart();
    }
    return {
        link: link,
        restrict: 'E',
        scope: { data: '=' }
    };
});