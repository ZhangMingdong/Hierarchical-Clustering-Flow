var mainApp = angular.module("myApp", ['ngRoute']);

mainApp.controller('FencingCtrl', function ($scope, $http,$window) {
    angular.element($window).on('resize', function () { $scope.$apply() })

    // 1.data field
    // match selection
    $scope.matchList=["men final","men semifinal 1","men semifinal 2","l4"];

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
        , phrases_sorted:[]       // sorted phrase
        , filter_value:500        // the threshold value of filter
        , filtered_phrase:0       // the number of filtered phrase
        , B:true                  // check box result
        , P1:true
        , P2:true
        , flow:{}                 // data of the tactic flow
        , selected_flow:{}        // flow of the selected part
        , focused_flow:{}         // flow of the focused bout
        , flow_groups:[]          // groups of flows, first and 2nd halves or different bouts
        , flow_player1:{}         // show flow of player 1
        , flow_player2:{}         // show flow of player 2
        , filters:[]              // filters of the index, 0 means kept
        , selected_node:""         // nodes in the tactic flow chart with mouse hover
        , selected_phrases:[]       // phrases of the selected nodes or flow in flowchart
        , nodeBias:{
            "S" :{w1:0.0,w2:0.0},
            "BB":{w1:0.2,w2:0.2},
            "FB":{w1:0.8,w2:0.2},
            "FF":{w1:0.5,w2:0.5},
            "BF":{w1:0.2,w2:0.8},
            "1" :{w1:1.0,w2:0.0},
            "=" :{w1:0.0,w2:0.0},
            "2" :{w1:0.0,w2:1.0}
        }          // bias of left part and right part of the nodes
        // display setting
        , Sum_flow:true          // show sum of the flow
        , Switch_pos: false       // change the positions of the two player
        , Show_tube: false         // show the tube of the flow
        , Show_individual: false   // show flow of individuals
        , Show_node_label: false   // show the labels of the nodes
        , orthogonal:false             // whether show orthogonal layout
        , asymmetric:false          // if show asymmetric layout
        , show_phrase:false           // a switch to trigger show phrase animation
        , Show_motions:false            // show motions or tactic nodes
        , Sort_phrases:false            // sort the phrases
        , Show_all_motions:false        // show all the motions, without scroll
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
        //console.log("read data v2");
        var series=[];
        d3.csv(fileNameV2, function(d) {
            var frame=parseFrame(d.time);
            series.push({
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

            // 1.generate motion data of hands and feet
            var arrMotion=generateMotionData(series);

            // 2.generate bout data
            var phrases=generatePhrases(series,arrMotion);
            var phrases_sorted=$scope.sortPhrase(phrases);


            // 3.generate tactic flow data
            var arrFlow=generateFlow_2(phrases);


            $scope.fencingData.motion_hands=arrMotion[0];
            $scope.fencingData.motion=arrMotion[1];
            $scope.fencingData.series=series;
            $scope.fencingData.phrases=phrases;
            $scope.fencingData.phrases_sorted=phrases_sorted;
            $scope.fencingData.flow=arrFlow[0];
            $scope.fencingData.flow_player1=arrFlow[1];
            $scope.fencingData.flow_player2=arrFlow[2];
            $scope.fencingData.flow_groups=[arrFlow[3],arrFlow[4]]
            // initiate selected flow to 0
            $scope.fencingData.selected_flow={
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

            // 4.update filters after read csv files
            updateFilter();

            $scope.$apply();

            if (error) throw error;
        });
    }

    // add a motion to the first argument
    function addMotion(motion,bout,player,start,end,type){
        motion.push({
            bout:+bout,
            player:player,
            frame_start:start,
            frame_end:end+1,
            bias_start:start,
            bias_end:end+1,
            type:type
        });

    }
    // generate motion data from the series
    function generateMotionData(series){
        var motion=[];                  // array of motion
        var motion_hands=[]             // array of hand motion

        // feet
        var frame_start1=-1;            // start frame of current motion 1
        var frame_start2=-1;            // start frame of current motion 2
        var type1="";                   // type of current motion 1
        var type2="";                   // type of current motion 2

        // hands
        var frame_start_hand_1=-1;      // start frame of current blade motion 1
        var frame_start_hand_2=-1;      // start frame of current blade motion 2
        var type_hand_1="";             // type of current blade motion 1
        var type_hand_2="";             // type of current blade motion 2

        var phraseIndex=-1;             // index of the phrase
        // 1.create the motion data, combine begin and end
        series.forEach(function(d){
            if(d.bout.length>0){            // new phrase
                phraseIndex=+d.bout;        // record this phrase
                frame_start1=-1;            // reset start frame
                frame_start2=-1
            }
            else{
                if(d.foot1.length>0){
                    if(d.foot1=="fs"){
                        frame_start1=d.frame;
                        type1="f"
                    }
                    else if(d.foot1=="ff"){
                        addMotion(motion,+phraseIndex,1,frame_start1,d.frame,type1);
                    }
                    else if(d.foot1=="as"){
                        frame_start1=d.frame;
                        type1="a"
                    }
                    else if(d.foot1=="af"){
                        addMotion(motion,+phraseIndex,1,frame_start1,d.frame,type1);
                    }
                    else if(d.foot1=="bs"){
                        frame_start1=d.frame;
                        type1="b"

                    }
                    else if(d.foot1=="bf"){
                        addMotion(motion,+phraseIndex,1,frame_start1,d.frame,type1);
                    }
                    else if(d.foot1=="cs"){
                        frame_start1=d.frame;
                        type1="c"

                    }
                    else if(d.foot1=="cf"){
                        addMotion(motion,+phraseIndex,1,frame_start1,d.frame,type1);
                    }
                    else{
                        console.log("unexpected foot");
                    }
                }
                if(d.foot2.length>0){
                    if(d.foot2=="fs"){
                        frame_start2=d.frame;
                        type2="f"
                    }
                    else if(d.foot2=="ff"){
                        addMotion(motion,+phraseIndex,2,frame_start2,d.frame,type2);
                    }
                    else if(d.foot2=="as"){
                        frame_start2=d.frame;
                        type2="a"
                    }
                    else if(d.foot2=="af"){
                        addMotion(motion,+phraseIndex,2,frame_start2,d.frame,type2);
                    }
                    else if(d.foot2=="bs"){
                        frame_start2=d.frame;
                        type2="b"

                    }
                    else if(d.foot2=="bf"){
                        addMotion(motion,+phraseIndex,2,frame_start2,d.frame,type2);
                    }
                    else if(d.foot2=="cs"){
                        frame_start2=d.frame;
                        type2="c"

                    }
                    else if(d.foot2=="cf"){
                        addMotion(motion,+phraseIndex,2,frame_start2,d.frame,type2);
                    }
                    else{
                        console.log(d.foot2)
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
                        addMotion(motion_hands,+phraseIndex,1,frame_start_hand_1,d.frame,type_hand_1);
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
                        addMotion(motion_hands,+phraseIndex,2,frame_start_hand_2,d.frame,type_hand_2);
                    }
                }
            }
        });

        // 2.calculate start frames of each phrase
        var start_frames=[];
        for(var i=0;i<phraseIndex;i++) start_frames.push(1000000);
        motion.forEach(function(d){

            if(d.frame_start<start_frames[d.bout-1]){
                start_frames[d.bout-1]=d.frame_start;
            }
        })

        // 3.make each motion start from frame 0, calculate bias_start and bias_end
        motion.forEach(function(d,i){
            motion[i].bias_start-=start_frames[d.bout-1];
            motion[i].bias_end-=start_frames[d.bout-1];
        })
        motion_hands.forEach(function(d,i) {
            motion_hands[i].bias_start-=start_frames[d.bout-1];
            motion_hands[i].bias_end-=start_frames[d.bout-1];

        })

        // 4.sort the data
        motion.sort(function(a,b){
            var bout=a.bout-b.bout;
            if(bout!=0) return bout;
            else{
                var player=a.player-b.player;
                if(player!=0) return player;
                else return a.frame_start-b.frame_start;
            }
        })


        return [motion_hands,motion];
    }
    // generate the data of the phrases
    function generatePhrases(series,arrMotion){
        // generate data for each phrase
        // 0.Declaration
        var phrases=[]

        // 1.structural data generation
        var frame_start=-1;              // start frame of the bout
        var frame_phrase_start=-1;       // start frame of the current phrase
        var frame_last=-1;               // the last frame
        var scale=40;                    // scale of frame to time
        var index=1;                     // index of current phrase
        var scores=[0,0];                // current scores of the two player
        var bias=0;                      // accumulated bias
        var arrPos1=[];                  // array of attack position of fencer 1
        var arrPos2=[];                  // array of attack position of fencer 2
        series.forEach(function(d){
            if(d.frame&&d.frame>0){
                // 1.pos
                if(d.pos1) arrPos1.push(d.pos1);
                if(d.pos2) arrPos2.push(d.pos2);
                // 2.frame
                // record the start frame of the bout
                if(frame_start==-1) frame_start=d.frame;
                // record the start frame of the current phrase
                if(frame_phrase_start==-1){
                    frame_phrase_start=d.frame;
                    // update bias
                    if(frame_last>-1){
                        bias+=(d.frame-frame_last-15);
                    }
                }
                // record this frame as last frame
                frame_last=d.frame;
            }
            else if(d.result){
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
                    focused: false,                      // whether focused in any of the views
                    states:[]                            // states of this phrase
                })
                arrPos1=[];
                arrPos2=[];
                // update scores
                if(d.score==1) scores[0]++;
                else if(d.score==2) scores[1]++;
                // reset start frame of current phrase
                frame_phrase_start=-1
            }
        })

        // 2.bind motion data to bouts data
        // footwork
        arrMotion[1].forEach(function(d){
        //    console.log(d);
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


        // 3.calculate states
        function generateStates(){
            var arrStates=["S"];             // states of this phrase
            var currentState="S";            // current state
            var state1="S";                   // state of player 1
            var state2="S";                   // state of player 2
            var motion1=false;                   // valid motion 1
            var motion2=false;                  // valid motion 2
            var steps1=0;       // steps of fencer 1
            var steps2=0;       // steps of fencer 2
            index=0;
            series.forEach(function(d){
                if(d.result){
                    //if(currentState!="FF")
                    {
                        // FB or BF before final state
                        if(state1=="A"&& (state2=="B"||state2=="F")) arrStates.push("FB");
                        else if((state1=="B"||state1=="F") && state2=="A") arrStates.push("BF");
                        /*
                            there may have problems,
                            in case one fencer give up priority without a lunge
                            2018/03/27
                         */
                    }

                    // final state
                    if(d.score==1) currentState="1"
                    else if(d.score==2) currentState="2";
                    else currentState="=";
                    arrStates.push(currentState);

                    // handle S-BB-FF-BF/FB
                    if(arrStates.length>4 && arrStates[1]=="BB" && arrStates[2]=="FF")
                    {
                        arrStates.splice(2,1);
                    }

                    phrases[index].steps=[steps1,steps2];
                    phrases[index++].states=arrStates;

                    arrStates=["S"];
                    currentState="S";
                    state1="S";
                    state2="S";
                    steps1=0;
                    steps2=0;
                }
                else{
                    // start:0,finish:1,no change 2
                    function inMotion(foot){
                        if(foot.length==2){
                            if(foot[1]=='f')
                                return 2;
                            else if(foot[1]=='s')
                                return 1;
                            else{
                                console.log("error");
                            }
                        }
                        else{
                            return 0;
                        }
                    }
                    function mapState(foot){
                        if(foot=="fs") return "F"
                        else if(foot=="bs" || foot=="cs") return "B"
                        else if(foot=="as") return "A";
                        else return "";
                    }
                    // 0.get new motion states
                    var newMotionState1=inMotion(d.foot1);
                    var newMotionState2=inMotion(d.foot2);
                    if(newMotionState1==1) motion1=true;
                    if(newMotionState2==1) motion2=true;
                    // 1.get new motions
                    var s1=mapState(d.foot1);
                    var s2=mapState(d.foot2);
                    var newState1=motion1?(s1?s1:state1):"";
                    var newState2=motion2?(s2?s2:state2):"";
                    // 2.process the motions
                    if(currentState=="FF"){
                        // no need to do any thing after FF
                    }
                    else if(state1=="A" && newState1!="A"){
                        currentState="FB";
                        arrStates.push(currentState);
                    }
                    else if(state2=="A" && newState2!="A"){
                        currentState="BF";
                        arrStates.push(currentState);
                    }
                    else if(currentState=="S"){
                        if(newState1=="A"&& newState2=="A"){
                            currentState="FF";
                            arrStates.push(currentState);
                        }
                        else if(newState1=="B"&& newState2=="B"){
                            currentState="BB";
                            arrStates.push(currentState);
                        }
                        // record steps
                        if(newState1=="F"&&newMotionState1==1) steps1++;
                        if(newState2=="F"&&newMotionState2==1) steps2++;
                    }
                    else if(currentState=="BB"){
                        if((state1=="A"||state1=="F")&&(state2=="A"||state2=="F")){
                            currentState="FF";
                            arrStates.push(currentState);
                        }
                    }
                    // 3.update states
                    state1=newState1;
                    state2=newState2;
                    if(newMotionState1==2) motion1=false;
                    if(newMotionState2==2) motion2=false;
                }
            })
        }

        function generateStates_2(){
            phrases.forEach(function(phrase,i){
                var arrStates=["S"];
                var step1=0;
                var step2=0;
                var tactic1="";
                var tactic2="";
                var currentState="";
                // 1.calculate steps and tactics
                if(phrase.feet1[1].type!="f"){
                    step1=1;
                    tactic1=phrase.feet1[1].type;
                }
                else {
                    step1=2;
                    tactic1=phrase.feet1[2].type;
                }

                if(phrase.feet2[1].type!="f"){
                    step2=1;
                    tactic2=phrase.feet2[1].type;
                }
                else {
                    step2=2;
                    tactic2=phrase.feet2[2].type;
                }
                // 2.get the 2nd states

                if(tactic1=="b"&&tactic2=="b"){
                    currentState="BB"
                    arrStates.push(currentState);
                }
                else if(tactic1=="b"){
                    currentState="BF"
                }
                else if(tactic2=="b"){
                    currentState="FB"
                }
                else{
                    currentState="FF"
                    arrStates.push(currentState);
                }
                // 3.get the states from the 3rd
                if(currentState=="BB"){
                    var lastMotion1=phrase.feet1[phrase.feet1.length-1].type;
                    var lastMotion2=phrase.feet2[phrase.feet2.length-1].type;


                    if(((lastMotion1=="f") || (lastMotion1=="a"))&&((lastMotion2=="f")||(lastMotion2=="a"))){
                        currentState="FF";
                        arrStates.push(currentState);
                    }
                }
                if(currentState!="FF"){
                    var arrA=[];
                    phrase.feet1.forEach(function(d){
                        if(d.type=="a") arrA.push(d);
                    })
                    phrase.feet2.forEach(function(d){
                        if(d.type=="a") arrA.push(d);
                    })
                    arrA.sort(function(a,b){
                        return a.frame_start-b.frame_start;
                    })
                    arrA.forEach(function(d){
                        if(d.player==1) arrStates.push("FB");
                        else arrStates.push("BF");
                    })
                }


                // 4.set the result
                if(phrase.score==1) arrStates.push("1")
                else if(phrase.score==2) arrStates.push("2")
                else arrStates.push("=")

                phrases[i].steps=[step1,step2];
                phrases[i].states=arrStates;

            })
        }
        generateStates_2();

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


    // parse a string of the flow
    function parseFlowFromState(flow,states){
        var lastState="";
        states.forEach(function(d){
            if(lastState=="S"){
                if(d=="FF") flow.sff++;
                else if(d=="BB") flow.sbb++;
                else if(d=="FB") flow.sfb++;
                else if(d=="BF") flow.sbf++;
            }
            else if(lastState=="BB"){
                if(d=="FF") flow.bbff++;
                else if(d=="FB") flow.bbfb++;
                else if(d=="BF") flow.bbbf++;
            }
            else if(lastState=="FF"){
                if(d=="=") flow.ffb++;
                else if(d=="1") flow.ff1++;
                else if(d=="2") flow.ff2++;
            }
            else if(lastState=="FB"){
                if(d=="FB") flow.fbfb++;
                else if(d=="BF") flow.fbb++;
                else if(d=="1") flow.fb1++;
                else if(d=="2") flow.fb2++;
            }
            else if(lastState=="BF"){
                if(d=="FB") flow.bfb++;
                else if(d=="BF") flow.bfbf++;
                else if(d=="1") flow.bf1++;
                else if(d=="2") flow.bf2++;
            }


            lastState=d;
        })
    }

    // generate flow from sequence of the states
    function generateFlow_2(phrases){
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
            if(d.scores[0]<8&&d.scores[1]<8)
                parseFlowFromState(flow_1st,d.states);
            else
                parseFlowFromState(flow_2nd,d.states);
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
    //    console.log("onSelectedNode");
    //    console.log(node);
        //console.log("onSelectedNode");
        // 0.update display
        $scope.fencingData.selectedInfo=[];
    //    $scope.fencingData.selectedInfo.push(node.bout);
    //    $scope.fencingData.selectedInfo.push(node.flow);
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
        console.log("onSelectedFlow",flow);
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
            //    parseFlow(newFlow,d.flow);
                parseFlowFromState(newFlow,d.states);
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
        //    parseFlow(newFlow,d.flow);
            parseFlowFromState(newFlow,d.states);
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
                    , BF: ["sbf", "bbbf","fbb","bfb"]
                    , FB: ["sfb", "bbfb","fbb","bfb"]
                    , FF: ["sff", "bbff"]
                }
                if (d.flow) {
                //    parseFlow(newFlow, d.flow);
                    parseFlowFromState(newFlow,d.states);
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
        //    console.log(d);
            //console.log(d.bout,d.pos1,d.pos2);
        //    if(d.flow) parseFlow(newFlow,d.flow);
            parseFlowFromState(newFlow,d.states);
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
        //    $scope.fencingData.selectedInfo.push(selectedPhrase.bout);
        //    $scope.fencingData.selectedInfo.push(selectedPhrase.flow);
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
        else if($scope.selectedMatch=="l4"){
            fileNameV2="../data/l4.csv";
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
            parseFlowFromState(flow,$scope.fencingData.phrases[$scope.fencingData.focused_bout].states);
        }
        $scope.fencingData.focused_flow=flow;

    });
    $scope.$watch('fencingData.filter_value',updateFilter)
    $scope.$watch('fencingData.B',updateFilter)
    $scope.$watch('fencingData.P1',updateFilter)
    $scope.$watch('fencingData.P2',updateFilter)

    //rp();
    function rp(){
        var DictTree;
        var Node;

        var data = [["S","FF","0"],["S","BF","2"],["S","FF","0"],["S","FF","0"],["S","FF","2"],["S","FF","0"],["S","BF","1"],["S","FF","2"],["S","BB","BF","2"],["S","FF","0"],["S","BB","FB","BF","2"],["S","FF","1"],["S","FF","2"],["S","BF","2"],["S","BB","FB","1"],["S","FF","0"],["S","BB","FB","1"],["S","BB","FB","BF","2"],["S","FF","0"],["S","BB","FB","1"],["S","BB","FF","1"],["S","BB","FB","1"],["S","BB","0"],["S","BF","1"],["S","FB","2"],["S","BB","FB","BF","2"],["S","BF","1"],["S","FF","0"],["S","FF","1"],["S","FF","1"],["S","FF","0"],["S","FB","0"],["S","BB","FB","1"],["S","FB","2"],["S","BB","FB","1"],["S","BF","0"],["S","BF","1"],["S","BF","1"]];


        var Node = (function(chara, deep, data) {
            function Node(chara, deep, data) {
                this.chara = chara;
                this.data = [];
                this.deep = deep;
                this.dataCnt = 0;
                this.sons = [];
            }
            return Node;
        })();

        var DictTree = (function(alphabet, startChara) {
            function DictTree(alphabet, startChara) {
                this.character = alphabet;
                this.wordList = [];
                this.root = new Node(startChara, 0, -1)
            }

            DictTree.prototype.addData = function(word) {
                this.wordList.push(word);
                var nowNode = this.root;
                for(var deep = 1; deep < word.states.length; deep++)
                {
                    var flag = true;
                    for(var k = 0; k < nowNode.sons.length; k++)
                    {
                        if(nowNode.sons[k].chara == word.states[deep])
                        {
                            nowNode = nowNode.sons[k];
                            flag = false;
                            break;
                        }
                    }
                    if (flag == true)
                    {
                        nowNode.sons.push(new Node(word.states[deep], deep, -1));
                        nowNode = nowNode.sons[k];
                    }
                }
                nowNode.data.push(word);
            }

            DictTree.prototype.getWords = function () {
                return this.wordList;
            }

            DictTree.prototype.getTree = function () {
                return this.root;
            }

            DictTree.prototype.dfs = function (nowword, nownode) {
                if(nownode.data.length > 0)
                {
                    for(var i = 0; i < nownode.data.length; i++)
                    {
                        this.sortedWords.push(nownode.data[i]);
                    }
                    return;
                }
                for(var j = 0; j < this.character.length; j++)
                {
                    for(var i = 0; i < nownode.sons.length; i++)
                    {
                        if(this.character[j] == nownode.sons[i].chara)
                        {
                            var newword = nowword.concat();
                            newword.push(nownode.chara);
                            this.dfs(newword, nownode.sons[i]);
                            break;
                        }
                    }
                }
            }

            DictTree.prototype.getSortedWords = function () {
                this.sortedWords = [];
                this.dfs([], this.root);
                return this.sortedWords;
            }

            return DictTree;
        })();

        var dictTree = new DictTree(["FF", "BF", "FB", "BB", "0", "1", "2"], "S");

        for (var i = 0; i < data.length; i++)
        {
            dictTree.addData({seq:i,states:data[i]});
        }
        console.log(dictTree.getTree());

        console.log(dictTree.getWords());

        console.log(dictTree.getSortedWords());


    }

    $scope.sortPhrase = function(phrases){
        var DictTree;
        var Node;

        var Node = (function(chara, deep, data) {
            function Node(chara, deep, data) {
                this.chara = chara;
                this.data = [];
                this.deep = deep;
                this.dataCnt = 0;
                this.sons = [];
            }
            return Node;
        })();

        var DictTree = (function(alphabet, startChara) {
            function DictTree(alphabet, startChara) {
                this.character = alphabet;
                this.wordList = [];
                this.root = new Node(startChara, 0, -1)
            }

            DictTree.prototype.addData = function(word) {

                this.wordList.push(word);
                var nowNode = this.root;
                for(var deep = 1; deep < word.states.length; deep++)
                {
                    var flag = true;
                    for(var k = 0; k < nowNode.sons.length; k++)
                    {
                        if(nowNode.sons[k].chara == word.states[deep])
                        {
                            nowNode = nowNode.sons[k];
                            flag = false;
                            break;
                        }
                    }
                    if (flag == true)
                    {
                        nowNode.sons.push(new Node(word.states[deep], deep, -1));
                        nowNode = nowNode.sons[k];
                    }
                }
                nowNode.data.push(word);
            }

            DictTree.prototype.getWords = function () {
                return this.wordList;
            }

            DictTree.prototype.getTree = function () {
                return this.root;
            }

            DictTree.prototype.dfs = function (nowword, nownode) {
                if(nownode.data.length > 0)
                {
                    for(var i = 0; i < nownode.data.length; i++)
                    {
                        this.sortedWords.push(nownode.data[i]);
                    }
                    return;
                }
                for(var j = 0; j < this.character.length; j++)
                {
                    for(var i = 0; i < nownode.sons.length; i++)
                    {
                        if(this.character[j] == nownode.sons[i].chara)
                        {
                            var newword = nowword.concat();
                            newword.push(nownode.chara);
                            this.dfs(newword, nownode.sons[i]);
                            break;
                        }
                    }
                }
            }

            DictTree.prototype.getSortedWords = function () {
                this.sortedWords = [];
                this.dfs([], this.root);
                return this.sortedWords;
            }

            return DictTree;
        })();

        var dictTree = new DictTree(["FF", "BF", "FB", "BB", "=", "1", "2"], "S");

        phrases.forEach(function(d){
            dictTree.addData(d);

        })
        return dictTree.getSortedWords();
    }
});

