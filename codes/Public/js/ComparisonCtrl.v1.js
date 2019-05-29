var mainApp = angular.module("myApp", ['ngRoute']);

mainApp.controller('ComparisonCtrl', function ($scope, $http,$window) {
    angular.element($window).on('resize', function () { $scope.$apply() })

    // 1.data field
    // match selection
    $scope.matchList=["men final","men semifinal 1","men semifinal 2"];

    // selected match
    $scope.selectedMatch="men final";


    // fencing data structure
    $scope.fencingData={
        series:[]                 // raw data: time, event, score, player1, player2, position
        , motion: []              // motions of feet
        , motion_hands:[]         // motions of hands
        , selectedNode:{}
        , selectedInfo:[]         // used for the selected node information display
        , filter:"no filter"      // "no filter","3 sceond"
        , selected_phrase:-1        // index of selected phrase, mouse click
        , focused_bout:-1         // index of focused bout, mouse hover
        , phrases:[]              // data of each phrase
        , filter_value:500        // the threshold value of filter
        , filtered_phrase:0       // the number of filtered phrase
        , B:true                  // check box result
        , P1:true
        , P2:true
        , flow:{}                 // data of the tactic flow
        , selected_flow:{}        // flow of the selected part
        , focused_flow:{}         // flow of the focused bout
        , flow_groups:[]          // groups of flows, first and 2nd halves or different bouts
        , Sum_flow:false           // show sum of the flow
        , flow_player1:{}         // show flow of player 1
        , flow_player2:{}         // show flow of player 2
        , Switch_pos: false       // change the positions of the two player
        , Show_tube: false         // show the tube of the flow
        , Show_individual: false   // show flow of individuals
        , Show_node_label: false   // show the labels of the nodes
        , filters:[]               // filters of the index, 0 means kept
        , selected_node:""         // nodes in the tactic flow chart with mouse hover
        , selected_phrases:[]       // phrases of the selected nodes or flow in flowchart
        , orthogonal:false           // whether show orthogonal layout
    }

    // 2. definition of the functions
    // version 2 of readData, added the behavior of two players
    var fileNameV2="../data/men_final_v2.csv";
    // parse the frame field
    function parseFrame(str){
        var arrTime=str.split(':');
        if(arrTime.length<3) return -1;
        var minute=arrTime[0];
        var second=arrTime[1];
        var ms=arrTime[2];
        var frame=30*((+second)+60*(+minute))+(+ms);
        return frame;

    }
    // function of reading data of version 2
    function readDataV2(){
        var bout_name1="../data/men_semifinal_1_v2.csv";
        var bout_name2="../data/men_semifinal_2_v2.csv";
        var bout_name3="../data/men_final_v2.csv";
        //console.log("read data v2");
        var series1=[];
        var series2=[];
        var series3=[];
        d3.csv(bout_name1, function(d) {
            var frame=parseFrame(d.time);
            series1.push({
                frame:frame
                ,foot1:d.foot1
                ,foot2:d.foot2
                ,hand1:d.hand1
                ,hand2:d.hand2
                ,pos1:d.pos1
                ,pos2:d.pos2
                ,parry_pos1:d.parry_pos1
                ,parry_pos2:d.parry_pos2
                ,result:d.result
                ,score:d.score
                ,bout:d.bout
                ,flow:d.flow
            });
        }, function(error, classes) {
            d3.csv(bout_name2, function(d) {
                var frame=parseFrame(d.time);
                series2.push({
                    frame:frame
                    ,foot1:d.foot1
                    ,foot2:d.foot2
                    ,hand1:d.hand1
                    ,hand2:d.hand2
                    ,pos1:d.pos1
                    ,pos2:d.pos2
                    ,parry_pos1:d.parry_pos1
                    ,parry_pos2:d.parry_pos2
                    ,result:d.result
                    ,score:d.score
                    ,bout:d.bout
                    ,flow:d.flow
                });
            }, function(error, classes) {
                d3.csv(bout_name3, function(d) {
                    var frame=parseFrame(d.time);
                    series3.push({
                        frame:frame
                        ,foot1:d.foot1
                        ,foot2:d.foot2
                        ,hand1:d.hand1
                        ,hand2:d.hand2
                        ,pos1:d.pos1
                        ,pos2:d.pos2
                        ,parry_pos1:d.parry_pos1
                        ,parry_pos2:d.parry_pos2
                        ,result:d.result
                        ,score:d.score
                        ,bout:d.bout
                        ,flow:d.flow
                    });
                }, function(error, classes) {
                    // generate motion data of hands and feet
                    var arrMotion=[[],[]];
                    // generate bout data
                    var phrases1=generatePhrases(series1,arrMotion);
                    var phrases2=generatePhrases(series2,arrMotion);
                    var phrases3=generatePhrases(series3,arrMotion);
                    // generate tactic flow data
                    var arrFlow1=generateFlow(phrases1);
                    var arrFlow2=generateFlow(phrases2);
                    var arrFlow3=generateFlow(phrases3);
                    var flow=combineFlows(arrFlow1[0],arrFlow3[0]);
                    var player1Only=true;
                    if(player1Only){
                        $scope.fencingData.flow_groups=[arrFlow1[0],arrFlow3[0]];

                        // generate flow sequence
                        var arrSeq=[];
                        phrases1.forEach(function(d){
                            if(d.flow){

                                var seq=generateFlowSequence(d.flow);
                                arrSeq.push(["S"].concat(seq));
                            }
                        })
                        phrases3.forEach(function(d){
                            if(d.flow){

                                var seq=generateFlowSequence(d.flow);
                                arrSeq.push(["S"].concat(seq));
                            }
                        })
                        console.log(JSON.stringify(arrSeq))

                    }
                    else{
                        flow=combineFlows(flow,arrFlow2[0]);
                        $scope.fencingData.flow_groups=[arrFlow1[0],arrFlow2[0],arrFlow3[0]];

                    }
                    //console.log(flow,arrFlow1[0],arrFlow2[0]);

                    $scope.fencingData.motion_hands=arrMotion[0];
                    $scope.fencingData.motion=arrMotion[1];
                    $scope.fencingData.series=series1;
                    $scope.fencingData.phrases=phrases1;
                    $scope.fencingData.flow=flow;
                    $scope.fencingData.flow_player1=arrFlow1[1];
                    $scope.fencingData.flow_player2=arrFlow1[2];
                    // 4.update filters after read csv files
                    updateFilter();
                    $scope.$apply();
                });

            });


            if (error) throw error;
        });
    }
    // add a motion to the first argument
    function addMotion(motion,bout,seq,player,start,end,type){
        motion.push({
            bout:+bout,
            player:player,
            seq:+seq,
            frame_start:start,
            frame_end:end,
            bias_start:start,
            bias_end:end,
            type:type
        });

    }
    // generate motion data from the series
    function generateMotionData(series){
        var motion=[];
        var motion_hands=[]

        var bout=-1;
        var seq1=0;
        var seq2=0;
        var frame_last=-1;
        var frame_end=-1;

        // feet
        var frame_start1=-1;
        var frame_start2=-1;
        var type1="";
        var type2="";

        // hands
        var frame_start_hand_1=-1;
        var frame_start_hand_2=-1;
        var type_hand_1="";
        var type_hand_2="";

        var boutLen=0;
        // create the motion data
        series.forEach(function(d){
            if(d.bout.length>0){            // net bout
                bout=+d.bout;               // record this bout
                seq1=0;                // reset sequence
                seq2=0
                frame_start1=-1; // reset start frame
                frame_start2=-1
            }
            else{
                if(d.foot1.length>0){
                    if(d.foot1=="fs"){
                        seq1=(++seq1);
                        frame_start1=d.frame;
                        type1="f"
                    }
                    else if(d.foot1=="ff"){

                        frame_end=d.frame;
                        addMotion(motion,+bout,+seq1,1,frame_start1,frame_end,type1);
                    }
                    else if(d.foot1=="as"){
                        seq1=(++seq1);
                        frame_start1=d.frame;
                        type1="a"
                    }
                    else if(d.foot1=="af"){
                        frame_end=d.frame;
                        addMotion(motion,+bout,+seq1,1,frame_start1,frame_end,type1);
                        //    motion.push({
                        //        bout:+bout,
                        //        player:1,
                        //        seq:+seq1,
                        //        frame_start:frame_start1,
                        //        frame_end:frame_end,
                        //        type:type1
                        //    });
                    }
                    else if(d.foot1=="bs"){
                        seq1=(++seq1);
                        frame_start1=d.frame;
                        type1="b"

                    }
                    else if(d.foot1=="bf"){
                        frame_end=d.frame;
                        addMotion(motion,+bout,+seq1,1,frame_start1,frame_end,type1);
                    }
                    else{
                        console.log("unexpected foot");
                    }
                }
                if(d.foot2.length>0){
                    if(d.foot2=="fs"){
                        seq2=(++seq2);
                        frame_start2=d.frame;
                        type2="f"
                    }
                    else if(d.foot2=="ff"){

                        frame_end=d.frame;
                        addMotion(motion,+bout,+seq2,2,frame_start2,frame_end,type2);
                        //    motion.push({
                        //        bout:+bout,
                        //        player:2,
                        //        seq:+seq2,
                        //        frame_start:frame_start2,
                        //        frame_end:frame_end,
                        //        type:type2
                        //    });
                    }
                    else if(d.foot2=="as"){
                        seq2=(++seq2);
                        frame_start2=d.frame;
                        type2="a"
                    }
                    else if(d.foot2=="af"){
                        frame_end=d.frame;
                        addMotion(motion,+bout,+seq2,2,frame_start2,frame_end,type2);
                    }
                    else if(d.foot2=="bs"){
                        seq2=(++seq2);
                        frame_start2=d.frame;
                        type2="b"

                    }
                    else if(d.foot2=="bf"){
                        frame_end=d.frame;
                        addMotion(motion,+bout,+seq2,2,frame_start2,frame_end,type2);
                    }
                    else{
                        console.log("unexpected foot");
                    }
                }
                if(d.hand1.length>0){
                    if(d.hand1=="as"){
                        frame_start_hand_1=d.frame;
                        type_hand_1="ha";
                    }
                    else if(d.hand1=="ps"){
                        frame_start_hand_1=d.frame;
                        type_hand_1="hp";
                    }
                    else if(d.hand1=="cs"){
                        frame_start_hand_1=d.frame;
                        type_hand_1="hc";
                    }
                    else if(d.hand1=="rs"){
                        frame_start_hand_1=d.frame;
                        type_hand_1="hr";
                    }
                    else if(d.hand1=="h"            // hit
                        ||d.hand1=="af"             // attack finished
                        ||d.hand1=="ap"             // attack been parried
                        ||d.hand1=="cf"             // counter attack finished
                        ||d.hand1=="p"              // parry
                        ||d.hand1=="pf"             // parry miss
                        ||d.hand1=="hp"             // hit be parried
                        ||d.hand1=="rf"             // reposte finished
                    ){
                        addMotion(motion_hands,+bout,0,1,frame_start_hand_1,d.frame,type_hand_1);
                        //    motion_hands.push({
                        //        bout:bout,
                        //        player:1,
                        //        seq:0,
                        //        frame_start:frame_start_hand_1,
                        //        frame_end:d.frame,
                        //        type:type_hand_1
                        //    });
                    }
                }
                if(d.hand2.length>0){
                    if(d.hand2=="as"){
                        frame_start_hand_2=d.frame;
                        type_hand_2="ha";
                    }
                    else if(d.hand2=="ps"){
                        frame_start_hand_2=d.frame;
                        type_hand_2="hp";
                    }
                    else if(d.hand2=="cs"){
                        frame_start_hand_2=d.frame;
                        type_hand_2="hc";
                    }
                    else if(d.hand2=="rs"){
                        frame_start_hand_2=d.frame;
                        type_hand_2="hr";
                    }
                    else if(d.hand2=="h"            // hit
                        ||d.hand2=="af"             // attack finished
                        ||d.hand2=="ap"             // attack been parried
                        ||d.hand2=="cf"             // counter attack finished
                        ||d.hand2=="p"              // parry
                        ||d.hand2=="pf"             // parry miss
                        ||d.hand2=="hp"             // hit be parried
                        ||d.hand1=="rf"             // reposte finished
                    ){
                        addMotion(motion_hands,+bout,0,2,frame_start_hand_2,d.frame,type_hand_2);
                        //    motion_hands.push({
                        //        bout:bout,
                        //        player:2,
                        //        seq:0,
                        //        frame_start:frame_start_hand_2,
                        //        frame_end:d.frame,
                        //        type:type_hand_2
                        //    });
                    }
                }
            }
            if(bout>boutLen) boutLen=bout;
        });
        // calculate start frames of each bout
        var start_frames=[];
        for(var i=0;i<boutLen;i++) start_frames.push(1000000);
        motion.forEach(function(d){
            if(d.seq==1 && d.frame_start<start_frames[d.bout-1]) start_frames[d.bout-1]=d.frame_start;
        })

        // make each motion start from frame 0
        motion.forEach(function(d,i){
            motion[i].bias_start-=start_frames[d.bout-1];
            motion[i].bias_end-=start_frames[d.bout-1];
        })
        motion_hands.forEach(function(d,i) {
            motion_hands[i].bias_start-=start_frames[d.bout-1];
            motion_hands[i].bias_end-=start_frames[d.bout-1];

        })

        // sort the data
        motion.sort(function(a,b){
            var bout=a.bout-b.bout;
            if(bout!=0) return bout;
            else{
                var player=a.player-b.player;
                if(player!=0) return player;
                else return a.seq-b.seq;
            }
        })

        return [motion_hands,motion];
    }
    // generate the data of the phrases
    function generatePhrases(series,arrMotion){
        // generate bout data
        // 0.Declaration
        var phrases=[]

        // 1.structural data generation
        var frame_start=-1;                             // start frame of the bout
        var frame_phrase_start=-1;                      // start frame of the current phrase
        var frame_last=-1;                              // the last frame
        var scale=40;                                   // scale of frame to time
        var index=1;                                    // index of current phrase
        var scores=[0,0];                               // current scores of the two player
        var bias=0;                                     // accumulated bias
        var arrPos1=[];
        var arrPos2=[];
        series.forEach(function(d){
            if(d.pos1) arrPos1.push(d.pos1);
            if(d.pos2) arrPos2.push(d.pos2);
            if(d.frame&&d.frame>0){
                // record the start frame of the bout
                if(frame_start==-1)
                    frame_start=d.frame;
                // record the start frame of the current phrase
                if(frame_phrase_start==-1){
                    frame_phrase_start=d.frame;
                    // update bias
                    if(frame_last>-1){
                        bias+=(d.frame-frame_last-15);
                    }
                }
            }
            if(d.result){
                var time_start=new Date((frame_phrase_start-frame_start-bias)*scale)
                var time_end=new Date((frame_last-frame_start-bias)*scale);

                phrases.push({
                    frame_start:frame_phrase_start,     // start frame
                    frame_end:frame_last,               // end frame
                    time_start:time_start,              // start time
                    time_end: time_end,                 // end time
                    bout:index++,                       // sequence
                    score: d.score,                     // scored player
                    result:d.result,                    // result of this phrase
                    hands1:[],                          // hand motions of player1
                    hands2:[],                          // hand motions of player2
                    feet1:[],                           // feet motions of player1
                    feet2:[],                           // feet motions of player2
                    scores:[scores[0],scores[1]],       // current scores
                    flow:d.flow,                        // generated tactic flow
                    pos1:arrPos1,
                    pos2:arrPos2,
                    focused: false                      // whether focused in any of the views
                })
                arrPos1=[];
                arrPos2=[];
                // update scores
                if(d.score==1) scores[0]++;
                else if(d.score==2) scores[1]++;
                // reset start frame of current phrase
                frame_phrase_start=-1
            }
            if(d.frame&&d.frame>0)
                frame_last=d.frame;
        })
        // 2.bind motion data to bouts data
        // footwork
        arrMotion[1].forEach(function(d){
            if(d.player==1)
                phrases[d.bout-1].feet1.push(d);
            else
                phrases[d.bout-1].feet2.push(d);
        })
        // bladework
        arrMotion[0].forEach(function(d){
            if(d.player==1)
                phrases[d.bout-1].hands1.push(d);
            else
                phrases[d.bout-1].hands2.push(d);
        })

        return phrases;

    }
    // parse flow from state FB
    function parseFromFB(flow,str){
        if(str[2]=='f'||str.substring(2,4)=="rr"){
            flow.fb1++;
        }
        else if(str[2]=='b'){
            if(str.substring(3,5)=="fb"){
                flow.fbfb++;
                parseFromFB(flow,str.substring(3))
            }
            else if(str.substring(3,5)=="bf"){
                flow.fbb++;
                parseFromBF(flow,str.substring(3))
            }
            else{
                console.log("error in the string")
                console.log(str.substring(3,5))
            }
        }
        else if(str[2]=='a'||str[2]=='r'||str[2]=='c'){
            flow.fb2++;
        }
        else{
            console.log(str)
            console.log("error in the string")
        }

    }
    // parse flow from state BF
    function parseFromBF(flow,str){
        if(str[2]=='f'||str.substring(2,4)=="rr"){
            flow.bf2++;
        }
        else if(str[2]=='b'){
            if(str.substring(3,5)=="bf"){
                flow.bfbf++;
                parseFromBF(flow,str.substring(3))
            }
            else if(str.substring(3,5)=="fb"){
                console.log("bfb")
                flow.bfb++;
                parseFromFB(flow,str.substring(3))
            }
            else{
                console.log("error in the string")
            }
        }
        else if(str[2]=='a'||str[2]=='r'||str[2]=='c'){
            flow.bf1++;

        }
        else{
            console.log("error in the string")
        }

    }
    // parse a string of the flow
    function parseFlow(flow,str){
        var seg=str.substring(0,2)
        if(seg=="ff"){
            flow.sff++;
            if(str[2]=='1')flow.ff1++;
            if(str[2]=='b')flow.ffb++;
            if(str[2]=='2')flow.ff2++;
        }
        else if(seg=="bb"){
            flow.sbb++;
            str=str.substring(2);
            seg=str.substring(0,2)
            if(seg=="ff"){
                flow.bbff++;
                if(str[2]=='1')flow.ff1++;
                if(str[2]=='b')flow.ffb++;
                if(str[2]=='2')flow.ff2++;
            }
            else if(seg=="fb") {
                flow.bbfb++;
                parseFromFB(flow,str);
            }
            else if(seg=="bf") {
                flow.bbbf++;
                parseFromBF(flow,str);
            }
        }
        else if(seg=="fb") {
            flow.sfb++;
            parseFromFB(flow,str);
        }
        else if(seg=="bf") {
            flow.sbf++;
            parseFromBF(flow,str);
        }
        else{
            console.log(str);
            console.log("error in the string")
        }
    }
    // generate flow from series data
    function generateFlow(phrases){
        var flow={
            sbb:0
            ,sfb:0
            ,sff:0
            ,sbf:0
            ,bbfb:0
            ,bbff:0
            ,bbbf:0
            ,fb1:0
            ,fb2:0
            ,ff1:0
            ,ffb:0
            ,ff2:0
            ,bf1:0
            ,bf2:0
            ,fbb:0
            ,bfb:0
            ,fbfb:0
            ,bfbf:0
        }
        var flow_1st={
            sbb:0
            ,sfb:0
            ,sff:0
            ,sbf:0
            ,bbfb:0
            ,bbff:0
            ,bbbf:0
            ,fb1:0
            ,fb2:0
            ,ff1:0
            ,ffb:0
            ,ff2:0
            ,bf1:0
            ,bf2:0
            ,fbb:0
            ,bfb:0
            ,fbfb:0
            ,bfbf:0
        }
        var flow_2nd={
            sbb:0
            ,sfb:0
            ,sff:0
            ,sbf:0
            ,bbfb:0
            ,bbff:0
            ,bbbf:0
            ,fb1:0
            ,fb2:0
            ,ff1:0
            ,ffb:0
            ,ff2:0
            ,bf1:0
            ,bf2:0
            ,fbb:0
            ,bfb:0
            ,fbfb:0
            ,bfbf:0
        }
        phrases.forEach(function(d){
            if(d.flow){
                if(d.scores[0]<8&&d.scores[1]<8)
                    parseFlow(flow_1st,d.flow);
                else
                    parseFlow(flow_2nd,d.flow);
            }
        })
        var flow=combineFlows(flow_1st,flow_2nd);

        // flow for each players
        var flow_player1={
            f:0
            ,b:0
            ,f1:0
            ,fb:0
            ,f2:0
            ,b1:0
            ,bb:0
            ,b2:0
        }
        var flow_player2={
            f:0
            ,b:0
            ,f1:0
            ,fb:0
            ,f2:0
            ,b1:0
            ,bb:0
            ,b2:0
        }
        phrases.forEach(function(d) {
            if(d.flow) {
                var fb1=d.flow[0]=='f';
                var fb2=d.flow[1]=='f';
                var s1=d.score==1;
                var s2=d.score==2;
                if(fb1){
                    flow_player1.f++;
                    if(s1) flow_player1.f1++;
                    else if(s2) flow_player1.f2++;
                    else flow_player1.fb++;
                }
                else{
                    flow_player1.b++;
                    if(s1) flow_player1.b1++;
                    else if(s2) flow_player1.b2++;
                    else flow_player1.bb++;
                }
                if(fb2){
                    flow_player2.f++;
                    if(s1) flow_player2.f1++;
                    else if(s2) flow_player2.f2++;
                    else flow_player2.fb++;
                }
                else{
                    flow_player2.b++;
                    if(s1) flow_player2.b1++;
                    else if(s2) flow_player2.b2++;
                    else flow_player2.bb++;
                }
            }
        });

        return [flow,flow_player1,flow_player2,flow_1st,flow_2nd];
    }

    // combine 2 flows
    function combineFlows(flow1,flow2){
        var flow={
             sbb :  flow1.sbb +flow2.sbb
            ,sfb :  flow1.sfb +flow2.sfb
            ,sff :  flow1.sff +flow2.sff
            ,sbf :  flow1.sbf +flow2.sbf
            ,bbfb:  flow1.bbfb+flow2.bbfb
            ,bbff:  flow1.bbff+flow2.bbff
            ,bbbf:  flow1.bbbf+flow2.bbbf
            ,fb1 :  flow1.fb1 +flow2.fb1
            ,fb2 :  flow1.fb2 +flow2.fb2
            ,ff1 :  flow1.ff1 +flow2.ff1
            ,ffb :  flow1.ffb +flow2.ffb
            ,ff2 :  flow1.ff2 +flow2.ff2
            ,bf1 :  flow1.bf1 +flow2.bf1
            ,bf2 :  flow1.bf2 +flow2.bf2
            ,fbb :  flow1.fbb +flow2.fbb
            ,bfb :  flow1.bfb +flow2.bfb
            ,fbfb:  flow1.fbfb+flow2.fbfb
            ,bfbf:  flow1.bfbf+flow2.bfbf
        }
        return flow;
    }

    // update fencingData.filters
    function updateFilter(){
        var arrFilter =new Array($scope.fencingData.phrases.length).fill(0);    // 0 means phrase of this index is kept

        $scope.fencingData.motion.forEach(function(d){
            if(d.bias_end>$scope.fencingData.filter_value) arrFilter[d.bout-1]=1;
        })
        $scope.fencingData.motion_hands.forEach(function(d){
            if(d.bias_end>$scope.fencingData.filter_value) arrFilter[d.bout-1]=1;
        })
        $scope.fencingData.phrases.forEach(function(d){
            var kept=false;
            if($scope.fencingData.B && d.score!=1 && d.score!=2)kept= true;
            if($scope.fencingData.P1 && d.score==1) kept = true;
            if($scope.fencingData.P2 && d.score==2) kept = true;
            if(!kept) arrFilter[d.bout-1]=1;
        })
        $scope.fencingData.filters=arrFilter;

        $scope.fencingData.filtered_phrase=arrFilter.filter(function(d){return d==0}).length;
    }

    // generate a sequence from the flow
    function generateFlowSequence(str){
        function generateFBSeq(str){
            var sequence=[];
            if(str[2]=='f'||str.substring(2,4)=="rr"){
                sequence.push("1");
            }
            else if(str[2]=='b'){
                if(str.substring(3,5)=="fb"){
                    sequence.push("FB");
                    generateFBSeq(str.substring(3)).forEach(function(d){
                        sequence.push(d);
                    })
                }
                else if(str.substring(3,5)=="bf"){
                    sequence.push("BF");
                    generateBFSeq(str.substring(3)).forEach(function(d){
                        sequence.push(d);
                    })
                }
                else{
                    console.log("error in the string")
                    console.log(str.substring(3,5))
                }
            }
            else if(str[2]=='a'||str[2]=='r'||str[2]=='c'){
                sequence.push("2");
            }
            else{
                console.log(str)
                console.log("error in the string")
            }
            return sequence;
        }
        function generateBFSeq(str){
            if(str[2]=='f'||str.substring(2,4)=="rr"){
                sequence.push("2");
            }
            else if(str[2]=='b'){
                if(str.substring(3,5)=="bf"){
                    sequence.push("BF");
                    generateBFSeq(str.substring(3)).forEach(function(d){
                        sequence.push(d);
                    })
                }
                else if(str.substring(3,5)=="fb"){
                    sequence.push("FB");
                    generateFBSeq(str.substring(3)).forEach(function(d){
                        sequence.push(d);
                    })
                }
                else{
                    console.log("error in the string")
                }
            }
            else if(str[2]=='a'||str[2]=='r'||str[2]=='c'){
                sequence.push("1");

            }
            else{
                console.log("error in the string")
            }
        }

        var sequence=[];
        var seg=str.substring(0,2)
        if(seg=="ff"){
            sequence.push("FF");
            if(str[2]=='1')sequence.push("1");
            if(str[2]=='b')sequence.push("0");
            if(str[2]=='2')sequence.push("2");
        }
        else if(seg=="bb"){
            sequence.push("BB");
            generateFlowSequence(str.substring(2)).forEach(function(d){
                sequence.push(d);
            })
        }
        else if(seg=="fb") {
            sequence.push("FB");
            if(str[2]=='f'||str.substring(2,4)=="rr"){
                sequence.push("1");
            }
            else if(str[2]=='b'){
                generateFlowSequence(str.substring(3)).forEach(function(d){
                    sequence.push(d);
                })
            }
            else if(str[2]=='a'||str[2]=='r'||str[2]=='c'){
                sequence.push("2");
            }
            else{
                console.log(str)
                console.log("error in the string")
            }
        }
        else if(seg=="bf") {
            sequence.push("BF");
            if(str[2]=='f'||str.substring(2,4)=="rr"){
                sequence.push("2");
            }
            else if(str[2]=='b'){
                generateFlowSequence(str.substring(3)).forEach(function(d){
                    sequence.push(d);
                })
            }
            else if(str[2]=='a'||str[2]=='r'||str[2]=='c'){
                sequence.push("1");
            }
            else{
                console.log(str)
                console.log("error in the string")
            }
        }
        else{
            console.log(str);
            console.log("error in the string")
        }
        return sequence;
    }

    // read in the default file
    readDataV2();



    // functions
    $scope.fencingData.onSelectedNode=function(node,callback){
        console.log("onSelectedNode");
        console.log(node);
        //console.log("onSelectedNode");
        // 0.update display
        $scope.fencingData.selectedInfo=[];
        $scope.fencingData.selectedInfo.push(node.bout);
        $scope.fencingData.selectedInfo.push(node.flow);
        $scope.fencingData.selectedInfo.push(node.scores[0]+":"+node.scores[1]);
        $scope.fencingData.selectedNode=node;


        callback();
        // using this codes will cause the change vanishing after hover another node and hover back
        // I forget why I used these codes
        // 20150703
        /*
         $scope.treeData.selectedNode={
         id: node.id
         ,year: node.year
         ,name: node.name
         ,source: node.source
         ,abstract: node.abstract
         ,notes:node.notes
         ,authors:node.authors
         ,authorList:node.authorList
         ,keywords:node.keywords
         ,keywordsList:node.keywordsList
         }
         */
    }
    $scope.fencingData.onSelectedFlow=function(flow,callback){
        //    console.log("onSelectedFlow",flow);
        // 1."selectedFlows": get the phrases contain the selected flow
        var selectedFlows=$scope.fencingData.phrases.filter(function(d){
            var newFlow={
                sbb:0
                ,sfb:0
                ,sff:0
                ,sbf:0
                ,bbfb:0
                ,bbff:0
                ,bbbf:0
                ,fb1:0
                ,fb2:0
                ,ff1:0
                ,ffb:0
                ,ff2:0
                ,bf1:0
                ,bf2:0
                ,fbb:0
                ,bfb:0
                ,fbfb:0
                ,bfbf:0
            }
            if(d.flow){
                parseFlow(newFlow,d.flow);
                return newFlow[flow.name];
            }
            else return false;
        })

        // 2. "newFlow": parse the selected phrase to build newFlow
        var newFlow={
            sbb:0
            ,sfb:0
            ,sff:0
            ,sbf:0
            ,bbfb:0
            ,bbff:0
            ,bbbf:0
            ,fb1:0
            ,fb2:0
            ,ff1:0
            ,ffb:0
            ,ff2:0
            ,bf1:0
            ,bf2:0
            ,fbb:0
            ,bfb:0
            ,fbfb:0
            ,bfbf:0
        }
        selectedFlows.forEach(function(d){
            parseFlow(newFlow,d.flow);
        })

        $scope.fencingData.selected_flow=newFlow;

        callback();
    }
    $scope.fencingData.onUnSelectedFlow=function(){
        //   console.log("onUnSelectedFlow");
        var newFlow={
            sbb:0
            ,sfb:0
            ,sff:0
            ,sbf:0
            ,bbfb:0
            ,bbff:0
            ,bbbf:0
            ,fb1:0
            ,fb2:0
            ,ff1:0
            ,ffb:0
            ,ff2:0
            ,bf1:0
            ,bf2:0
            ,fbb:0
            ,bfb:0
            ,fbfb:0
            ,bfbf:0
        }
        $scope.fencingData.selected_flow=newFlow;
    }
    $scope.fencingData.onSelectedFlowNode=function(node,callback){
        //console.log("onSelectedFlowNode",node);
        $scope.fencingData.selected_node=node.name;

        var selectedPhrases=[];
        if(node.name=="1"||node.name=="2"||node.name=="="){
            // 1."selectedFlows": get the phrases contain the selected flow
            selectedPhrases=$scope.fencingData.phrases.filter(function(d){
                return d.score==node.name ||
                    (!d.score && d.result && node.name=="=")
            })
        }
        else if(node.name!="S"){ // nodes: FF, BB, BF, FB
            selectedPhrases=$scope.fencingData.phrases.filter(function(d) {
                var newFlow = {
                    sbb: 0
                    , sfb: 0
                    , sff: 0
                    , sbf: 0
                    , bbfb: 0
                    , bbff: 0
                    , bbbf: 0
                    , fb1: 0
                    , fb2: 0
                    , ff1: 0
                    , ffb: 0
                    , ff2: 0
                    , bf1: 0
                    , bf2: 0
                    , fbb: 0
                    , bfb: 0
                    , fbfb: 0
                    , bfbf: 0
                }
                var pos = {
                    BB: ["sbb"]
                    , BF: ["sbf", "bbbf"]
                    , FB: ["sfb", "bbfb"]
                    , FF: ["sff", "bbff"]
                }
                if (d.flow) {
                    parseFlow(newFlow, d.flow);
                    //console.log(pos);
                    var result = false;
                    pos[node.name].forEach(function (dd) {
                        if (newFlow[dd]) result = true;
                    })
                    return result;
                }
                else return false;
            });

        }

        // 2. "newFlow": parse the selected phrase to build newFlow
        var newFlow={
            sbb:0
            ,sfb:0
            ,sff:0
            ,sbf:0
            ,bbfb:0
            ,bbff:0
            ,bbbf:0
            ,fb1:0
            ,fb2:0
            ,ff1:0
            ,ffb:0
            ,ff2:0
            ,bf1:0
            ,bf2:0
            ,fbb:0
            ,bfb:0
            ,fbfb:0
            ,bfbf:0
        }
        selectedPhrases.forEach(function(d){
            console.log(d);
            //console.log(d.bout,d.pos1,d.pos2);
            parseFlow(newFlow,d.flow);
        })

        $scope.fencingData.selected_phrases=selectedPhrases;
        $scope.fencingData.selected_flow=newFlow;

        callback();
    }
    $scope.fencingData.onUnSelectedFlowNode=function(){
        //console.log("onUnSelectedFlowNode");
        $scope.fencingData.selected_node="";
        $scope.fencingData.selected_phrases=[];
        $scope.fencingData.onUnSelectedFlow();
    }
    $scope.fencingData.onFocusedPhrase=function(focusedIndex){
        //    console.log("focused phrase")
        if(focusedIndex==-1){
            if($scope.fencingData.focused_bout>-1){
                $scope.fencingData.phrases[$scope.fencingData.focused_bout].focused=false;
                $scope.fencingData.focused_bout=-1;
            }
        }
        else{
            if($scope.fencingData.focused_bout>-1){
                $scope.fencingData.phrases[$scope.fencingData.focused_bout].focused=false;
            }
            $scope.fencingData.phrases[focusedIndex].focused=true;
            $scope.fencingData.focused_bout=focusedIndex;

            var selectedPhrase=$scope.fencingData.phrases[focusedIndex];

            // update information
            $scope.fencingData.selectedInfo=[];
            $scope.fencingData.selectedInfo.push(selectedPhrase.bout);
            $scope.fencingData.selectedInfo.push(selectedPhrase.flow);
            $scope.fencingData.selectedInfo.push(selectedPhrase.scores[0]+":"+selectedPhrase.scores[1]);
            $scope.fencingData.selectedNode=selectedPhrase;
        }
        $scope.$apply();
    }

    // 3.watch events
    $scope.$watch('selectedMatch', function() {
        if($scope.selectedMatch=="men final"){
            fileNameV2="../data/men_final_v2.csv";
        }
        else if($scope.selectedMatch=="men semifinal 1"){
            fileNameV2="../data/men_semifinal_1_v2.csv";
        }
        else if($scope.selectedMatch=="men semifinal 2"){
            fileNameV2="../data/men_semifinal_2_v2.csv";
        }
        readDataV2();
    });
    $scope.$watch('fencingData.focused_bout', function() {
        //    console.log($scope.fencingData.focused_bout);
        var flow={
            sbb:0
            ,sfb:0
            ,sff:0
            ,sbf:0
            ,bbfb:0
            ,bbff:0
            ,bbbf:0
            ,fb1:0
            ,fb2:0
            ,ff1:0
            ,ffb:0
            ,ff2:0
            ,bf1:0
            ,bf2:0
            ,fbb:0
            ,bfb:0
            ,fbfb:0
            ,bfbf:0
        }
        if($scope.fencingData.focused_bout>=0){
            //    console.log($scope.fencingData.phrases[$scope.fencingData.focused_bout].flow);
            if($scope.fencingData.phrases[$scope.fencingData.focused_bout].flow){

                parseFlow(flow,$scope.fencingData.phrases[$scope.fencingData.focused_bout].flow)
            }
        }
        $scope.fencingData.focused_flow=flow;

    });
    $scope.$watch('fencingData.filter_value',updateFilter)
    $scope.$watch('fencingData.B',updateFilter)
    $scope.$watch('fencingData.P1',updateFilter)
    $scope.$watch('fencingData.P2',updateFilter)
});



