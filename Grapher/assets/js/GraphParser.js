//merge函数，参数为一个数组：元素是一个channel的gexf；
//          return这些channel组成的对象
//draw: 参数为xml对象，画出相应的图表
//createGraph: 参数为一个xml对象，利用该xml内的node和edge创建一个graph对象，返回该对象
//filter:  参数为xml文件和要筛选的条件，根据条件返回筛选后的xml
//changeDigram: 无参数，调用filter，作图
//对象：
//graph:包含的node和edge的数组  （改为键名为id的map，键为对象的map？）
//node
//edge

//根据新数据更改creatgraph
"use strict"
var t = true;
var xmlfile;
var s = "http://www.gephi.org/gexf/1.2draft";


function draws(team, channels) {
    var channel_xmls = [];
    // console.log(channels.length)
    console.log(team, channels)
    for (var index = 0; index < channels.length; index++) {
        var channel = channels[index];
        // console.log(index, channel, channels.valueOf(1))
        // console.log($.inArray(channel, Object.keys(loaded_channels)))
        // console.log(channel, Object.keys(loaded_channels))
        if ((jQuery.inArray(channel, Object.keys(loaded_channels))) === -1) {
            // console.log('inside')
            get_graph_xml(team, channel, function (ret) {
                loaded_channels[channel] = ret;
                channel_xmls.push(loaded_channels[channel])
                var new_xml = merge(channel_xmls);
                draw(new_xml, conditions)
            });
        } else {
            channel_xmls.push(loaded_channels[channel])
            var new_xml = merge(channel_xmls);
            draw(new_xml, conditions);
        }
    }
}

function merge(channelxml_Array) {
    // console.log('this is it ', channelxml_Array)
    var node_list = [];
    var edge_list = {};
    // var graph = new Graph();
    var base_xml = channelxml_Array[0].cloneNode("gexf");
    var base_nodes = base_xml.getElementsByTagName("nodes")[0];
    var base_edges = base_xml.getElementsByTagName("edges")[0];

    // init node_list
    var __nodes = base_xml.getElementsByTagName("node");
    for (var j = 0; j < __nodes.length; j++){
        node_list.push(__nodes[j].id);
    }

    // init edge_weight
    var __edges = base_xml.getElementsByTagName("edge");
    var remove_edges = [];
    var cnt = 0
    for (var j = 0; j < __edges.length; j++){
        var added_edge =  __edges[j];
        // console.log(added_edge.getElementsByTagName('attvalue')[1])
        var added_value = added_edge.getElementsByTagName('attvalue')[1].getAttribute("value");
        var current_value = edge_list[added_edge.getAttribute("source") + '->' + added_edge.getAttribute("target")];
        // console.log("key", added_edge.getAttribute("source") + '->' + added_edge.getAttribute("target"))
        // console.log('value', current_value);
        if (current_value){
            cnt += 1;
            edge_list[added_edge.getAttribute("source") + '->' + added_edge.getAttribute("target")] = [parseInt(current_value[0]) + parseInt(added_value), current_value[1] + 1];
            remove_edges.push(added_edge)
        }else {
            edge_list[added_edge.getAttribute("source") + '->' + added_edge.getAttribute("target")] = [added_value, 1];

        }
    }
    for (var j = 0; j<remove_edges.length; j++){
        base_xml.getElementsByTagName("edges")[0].removeChild(remove_edges[j]);
        // console.log('removed an edge')
    }
    // console.log(cnt)
    // console.log(remove_edges.length)



    for (var index = 1; index < channelxml_Array.length; index++) {
        // merge nodes
        var added_html = channelxml_Array[index];
        var added_nodes = added_html.getElementsByTagName("node");
        var added_edges = added_html.getElementsByTagName("edge");
        for (var j = 0; j < added_nodes.length; j++){
            var node = added_nodes[j];
            if (jQuery.inArray(node.id, node_list) !== -1){
                console.log('skipped', node.id)
            }else{
                base_nodes.innerHTML += added_nodes[j].innerHTML;
            }

        }

        //merge edges

        for (var j = 0; j < added_edges.length; j++){
            var added_edge =  added_edges[j];

            var current_value = edge_list[added_edge.getAttribute("source") + '->' + added_edge.getAttribute("target")];
            var added_value = added_edges[j].getElementsByTagName('attvalue')[1].getAttribute("value");
            if (current_value) {
                edge_list[added_edge.getAttribute("source") + '->' + added_edge.getAttribute("target")] = [parseInt(current_value[0]) + parseInt(added_value), current_value[1] + 1];
                continue;
            }else {
                base_edges.innerHTML += added_edges[j].innerHTML;
                edge_list[added_edge.getAttribute("source") + '->' + added_edge.getAttribute("target")] = [added_value, 1];
            }
        }
    }

    // calculate_edge_weight

    var edges = base_xml.getElementsByTagName("edge")
    for (var j = 0; j < edges.length; j++){
        var current_edge = edges[j];
        var calculate_list = edge_list[current_edge.getAttribute("source") + '->' + current_edge.getAttribute("target")]
        var calculated_value = parseInt(calculate_list[0]) / parseInt(calculate_list[1])
        edges[j].getElementsByTagName('attvalue')[1].setAttribute("value", calculated_value)
    }

    return base_xml;


}

function draw(xml, condition) {
    var node_number = xml.getElementsByTagName('node').length;
    var edge_number = xml.getElementsByTagName('edge').length;
    console.log('node', node_number);
    console.log('edge', edge_number);
    changeidNumber("#node_number", node_number);
    changeidNumber("#edge_number", edge_number);
    var dom = document.getElementById("main");
    var myChart = echarts.init(dom);
    var app = {};
    var option = null;
    app.title = 'FLUO';

    var graph = echarts.dataTool.gexf.parse(xml);
    var categories = [];
    for (var i = 0; i < 0; i++) {
        categories[i] = {
            name: 'Channel ' + i
        };
    }
    graph.nodes.forEach(function (node) {
        node.itemStyle = null;
        node.symbolSize = 10;
        node.value = 'Channel X';
        node.category = node.attributes.modularity_class;
        // Use random x, y
        node.x = node.y = null;
        node.draggable = true;
    });
    option = {
        title: {
            text: '',
            subtext: '',
            top: 'bottom',
            left: 'right'
        },
        tooltip: {},
        legend: [{
            // selectedMode: 'single',
            data: categories.map(function (a) {
                return a.name;
            })
        }],
        animation: false,
        series: [
            {
                name: '',
                type: 'graph',
                layout: 'force',
                data: graph.nodes,
                links: graph.links,
                categories: categories,
                roam: true,
                label: {
                    normal: {
                        position: 'right'
                    }
                },
                force: {
                    repulsion: 100
                }
            }
        ]
    };

    myChart.setOption(option);
    if (option && typeof option === "object") {
        myChart.setOption(option, true);
    }


}

function changeidNumber(id, number) {
    $(id).text(number);
}

// node_filter = {
//     'weight': "0.1-0.5",
//     "people_filter": ['Boris', "Liuliangxi"],
//     "people_filter_in": true,
//     "channel": [],
// }
//filter为一个function，传入一个xml对象以及要筛选条件，返回一个筛选后的xml对象
function creatGraph(xmlFile) {
    // console.log(xmlFile)
    var nodes = xmlFile.getElementsByTagName('node');
    var links = xmlFile.getElementsByTagName('edge');
    var graph = new Graph();

    for (var i = 0; i < nodes.length; i++) {
        // console.log(nodes)
        var channel = new Array();
        var attvalues = nodes[i].getElementsByTagName("attvalue");
        if (attvalues.length != 0) {
            for (var j = 2; j < attvalues.length; j++) channel.push(attvalues[j].getAttribute("value"));
            var node = new Node(nodes[i].getAttribute("id"),   //Node(id, label, team, weight, channel)
                nodes[i].getAttribute("label"),
                attvalues[1].getAttribute("value"),
                attvalues[0].getAttribute("value"),
                channel);
            graph.addNode(node);
            graph.nodesid[i] = node.id;
        }
    }
    for (i = 0; i < links.length; i++) {//Edge(id, source, target, weight, channel, date, message)
        var attvalues = links[i].getElementsByTagName("attvalue");
        if (attvalues.length != 0) {
            var edge = new Link(links[i].getAttribute("id"),
                links[i].getAttribute("source"),
                links[i].getAttribute("target"),
                links[i].getAttribute("weight"),
                attvalues[4].getAttribute("value"),
                attvalues[2].getAttribute("value"),
                attvalues[0].getAttribute("value"),
                attvalues[3].getAttribute("value"));
            graph.addLink(edge);
        }
    }
    return graph;
}

function filter(graph, conditions) {

    //为了把filter写到一个函数里，要筛选的条件集成到一个（ ）的对象里；
    //从map对象里获取要筛选的条件
    // console.log("rawGraph in filter",graph);
    var channelChoose = conditions.channel;
    var nodeWeightUpLimit = parseInt(conditions.nodeWeightUpLimit);
    var nodeWeightDownLimit = parseInt(conditions.nodeWeightDownLimit);
    var edgeWeightUpLimit = parseInt(conditions.edgeWeightUpLimit);
    var edgeWeightDownLimit = parseInt(conditions.edgeWeightDownLimit);
    var keywords = conditions.keywords;
    var ifconclude = new Boolean();//是否包含
    ifconclude = conditions.ifconclude;
    //var dateDownLimit = new Date(conditions.dateDownLimit);
    //var dateUpLimit = new Date(conditions.dateUpLimit);
    var newgraph = new Graph;
    //读取
    var selectNodesid = [];

    //console.log(time.toLocaleTimeString());
    //对node进行筛选

    for (var nodekey in graph.getNodes()) {
        var node = graph.getNodes()[nodekey];
        var t = new Boolean();
        t = false;
        //判断在不在channel
        for (var channel in node.getchannel()/*graph.nodes[i].channel.length*/) {
            // var index = $.inArray(node.getchannel()[channel]/*graph.nodes[i].channel[j]*/, channelChoose);
            var index = 1
            //console.log(j,index);
            if (index != -1) {
                t = true;
                // console.log(graph.nodes[i].channel[j]);
                break;
            }
        }
        var weight = parseInt(node.weight);
        // console.log(nodekey, weight, t)
        if ((t == true) && (weight >= nodeWeightDownLimit) && (weight <= nodeWeightUpLimit)) {
            selectNodesid.push(node.id);
        }

    }
    //console.log(selectNodes);
    //console.log(time.toLocaleTimeString());
    //对edge进行筛选
    for (var linkkey in graph.getLinks()) {
        var link = graph.getLinks()[linkkey];
        var t = new Boolean();
        t = false;
        var index1 = $.inArray(link.getchannel(), channelChoose);
        index1 = 1;
        var index2 = $.inArray(link.getsource(), selectNodesid);
        var index3 = $.inArray(link.gettarget(), selectNodesid);
        var date = link.getdate();
        if (index1 != -1) {
            //在不在所属channel
            if ((index2 != -1) || (index3 != -1)) {                                         //源点和目标点是否囊括所筛节点
                var weight = parseInt(link.getweight());
                if ((weight <= edgeWeightUpLimit) && (weight >= edgeWeightDownLimit)) {   //weight范围是否合理

                    //if ((date<=dateUpLimit)&&(date>=dateDownLimit)){
                    if (keywords.length != 0) {
                        for (var j = 0; j < keywords.length; j++) {
                            if (link.getmessage().indexOf(keywords[j]) != -1) {           //是否包含关键字
                                t = true;
                                break
                            }
                        }
                    }
                    if ((keywords.length == 0) || (ifconclude == false && t == false) || (ifconclude == true && t == true)) { //判断是否满足关键词的包含关系
                        newgraph.addLink(link);

                        if (newgraph.getNodes()[link.gettarget()] == null) newgraph.addNode(graph.getNode(link.gettarget()));
                        if (newgraph.getNodes()[link.getsource()] == null) newgraph.addNode(graph.getNode(link.getsource()));

                    }
                }
                //}
            }
        }
    }
    //console.log("newgraph in filter",newgraph);

    //替换
    //node
    // var y = xmlFile.getElementsByTagName("nodes")[0];
    // y.parentNode.removeChild(y);
    // var newNodes = xmlFile.createElement("nodes");
    // for (i = 0; i < selectNodes1.length; i++) {
    //     var newNode = xmlFile.createElement("node");
    //     newNode.setAttribute("id", graph.nodes[i].id);
    //     newNode.setAttribute("label", graph.nodes[i].label);
    //     newNode.setAttribute("weight", graph.nodes[i].weight);
    //     var attri = newNode.createElement("attvalues");
    //     newNode.appendChild(attri);
    //     newNodes.appendChild(newNode);
    // }

    //edge
    /*
    y = xmlFile.getElementsByTagName("edges")[0];
    y.parentNode.removeChild(y);
    var newEdges = xmlFile.createElement("edges");
    for (i = 0; i < selectEdge.length; i++) {
        var newEdge = xmlFile.createElement("edge");
        newedge.setAttribute("id", graph.edges[i].id);
        newedge.setAttribute("source", graph.edges[i].source);
        newedge.setAttribute("target", graph.edges[i].target);
        newedge.setAttribute("weight", graph.edges[i].weight);
        var attri = newEdge.createElement("attvalues");
        newEdges.appendChild(newNode);
        //console.log(newEdge);
    }
    x.getElementsByTagName("graph")[0].appendChild(newNodes);
    x.getElementsByTagName("graph")[0].appendChild(newEdges);
    console.log(time.toLocaleTimeString());*/


    //console.log(time.toLocaleTimeString());
    //删除node
    var newNodes = xmlfile.createElement("nodes");
    var y = xmlfile.getElementsByTagName("nodes")[0];
    // console.log(xmlfile.getElementsByTagName("nodes"));
    // console.log('new graph', newgraph);
    // console.log('new graph', newgraph.getNodes());
    for (var node in newgraph.getNodes()/*i = 0; i < newgraph.nodes.length; i++*/) {
        // console.log('new')
        // console.log(newNode);
        newNodes.appendChild(graph.makeNode(newgraph.getNodes()[node]));
    }
    y.parentNode.removeChild(y);
    xmlfile.getElementsByTagName("graph")[0].appendChild(newNodes);

    //console.log(selectEdge);
    //删除edge
    var newEdges = xmlfile.createElement("edges");
    y = xmlfile.getElementsByTagName("edges")[0];
    for (var link in newgraph.getLinks()/*i = 0; i < newgraph.links.length; i++*/) {

        newEdges.appendChild(graph.makeEdge(newgraph.getLinks()[link]));
        //console.log(newEdge);
    }
    y.parentNode.removeChild(y);
    xmlfile.getElementsByTagName("graph")[0].appendChild(newEdges);
    // console.log(time.toLocaleTimeString());
    // console.log(newgraph);
    return {
        xml: xmlfile,
        node_number: newgraph.nodeslength(),
        edge_number: newgraph.linkslength()
    }
}


Array.prototype.indexOf = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) return i;
    }
    return -1;
}
Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
}

function Graph() {
    this.links = new Object();
    this.nodes = new Object();
    this.nodesid = [];
}

Graph.prototype.getNodes = function () {
    return this.nodes;
}
Graph.prototype.getLinks = function () {
    return this.links;
}
Graph.prototype.addLink = function (newLink) {
    this.links[newLink.getid()] = newLink;
}
Graph.prototype.addNode = function (newNode) {
    this.nodes[newNode.getid()] = newNode;

}
Graph.prototype.getNode = function (i) {
    return this.nodes[i];
}

Graph.prototype.getLink = function (i) {
    return this.links[i];
}
Graph.prototype.linkslength = function () {
    return length(this.links);
}
Graph.prototype.nodeslength = function () {
    return length(this.nodes);
}
Graph.prototype.isnode = function (id) {
    return (!(this.nodes[id] == null));
}
Graph.prototype.getnodebyid = function (id) {
    return this.nodes[id];
}
Graph.prototype.addGraph = function (graph) {
    for (var nodekey in graph.getNodes()) {
        this.addNode(graph.getNodes()[nodekey]);
    }
    for (var linkkey in graph.getLinks()) {
        this.addLink(graph.getLinks()[linkkey])
    }
}
Graph.prototype.makeNode = function (graphnode) {
    var newNode = xmlfile.createElement("node");
    newNode.setAttribute("id", graphnode.getid());
    newNode.setAttribute("label", graphnode.getlabel());
    newNode.setAttribute("xmlns", s);
    newNode.setAttribute("team", graphnode.getteam());
    var attvalues = xmlfile.createElement("attvalues");
    var attvalue = xmlfile.createElement("attvalue");
    attvalue.setAttribute("for", "weight");
    attvalue.setAttribute("value", graphnode.getweight());
    attvalues.appendChild(attvalue);
    newNode.appendChild(attvalues);
    return newNode;
}
Graph.prototype.makeEdge = function (graphedge) {
    var newEdge = xmlfile.createElement("edge");
    newEdge.setAttribute("id", graphedge.getid());
    newEdge.setAttribute("xmlns", s);
    newEdge.setAttribute("team", graphedge.getteam());
    newEdge.setAttribute("source", graphedge.getsource());
    newEdge.setAttribute("target", graphedge.gettarget());
    newEdge.setAttribute("weight", graphedge.getweight());
    var attvalues = xmlfile.createElement("attvalues");
    var attvalue = xmlfile.createElement("attvalue");
    attvalue.setAttribute("for", "weight");
    attvalue.setAttribute("value", graphedge.getweight());
    attvalues.appendChild(attvalue);
    newEdge.appendChild(attvalues);
    return newEdge;
}

function Link(id, source, target, weight, channel, date, message, team) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.weight = weight;
    this.channel = channel;
    this.date = date;
    this.message = message;
    this.team = team;
}

Link.prototype.getid = function () {
    return this.id;
}
Link.prototype.getsource = function () {
    return this.source;
}
Link.prototype.gettarget = function () {
    return this.target;
}
Link.prototype.getweight = function () {
    return this.weight;
}
Link.prototype.getchannel = function () {
    return this.channel;
}
Link.prototype.getdate = function () {
    return this.date;
}
Link.prototype.getmessage = function () {
    return this.message;
}
Link.prototype.getteam = function () {
    return this.team;
}


function Node(id, label, team, weight, channel) {
    this.id = id;
    this.label = label;
    this.team = team;
    this.weight = weight;
    this.channel = channel;
}

Node.prototype.getid = function () {
    return this.id;
}
Node.prototype.getlabel = function () {
    return this.label;
}
Node.prototype.getweight = function () {
    return this.weight;
}
Node.prototype.getchannel = function () {
    return this.channel;
}
Node.prototype.getteam = function () {
    return this.team;
}

function loadXMLDoc(dname) {
    if (window.XMLHttpRequest) {
        var xhttp = new XMLHttpRequest();
    }
    else {
        var xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("GET", dname, false);
    xhttp.send();
    return xhttp.responseXML;
}

function f(s) {
    var a = [];
    a.push(s.slice(0, 80));
    if (s.length > 80) a = a.concat(f(s.slice(80)));
    return a;
}

function length(obj) {
    var count = 0;
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            count++;
        }
        ;
    }
    ;
    return count;
}

function createXml(str) {
    if (document.all) {
        var xmlDom = new ActiveXObject("Microsoft.XMLDOM")
        xmlDom.loadXML(str)
        return xmlDom
    }
    else
        return new DOMParser().parseFromString(str, "text/xml")
}
