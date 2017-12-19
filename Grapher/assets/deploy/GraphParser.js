//3.若作图api崩溃，继续生成xml文件；
//增加date对象
//4.解决传参问题，可尝试建立嵌套函数；
"use strict"
var t = new Boolean();
t = true;
var rawGraph;
var xmlfile;
var s = "http://www.gephi.org/gexf/1.2draft";
var current_file;

function draw(filepath) {
    var conditions = {
        "channel": ['# sig-gcp'],
        "nodeWeightUpLimit": "1000",
        "nodeWeightDownLimit": "0",
        "edgeWeightUpLimit": "1",
        "edgeWeightDownLimit": "-1",
        "keywords": [],
        "dateDownLimit": "0000000000000",
        "dateUpLimit": "9999999999999",
        "ifconclude": "0"
    }

    if (filepath !== current_file) {
        $.get("/graph/T024HV01E/C024HV01L C08C4GYQ0", function (ret) {
            xmlfile = new DOMParser().parseFromString(ret, "text/xml");
            console.log('notice here', xmlfile);
            var number_of_nodes = xmlfile.getElementsByTagName('node').length;
            var number_of_edges = xmlfile.getElementsByTagName('edge').length;
            var number_of_channels = 1;
            rawGraph = creatGraph(xmlfile);
            changeDiagram(number_of_channels, number_of_nodes, number_of_edges, conditions);
        })
        current_file = filepath;
    } else {
        conditions = {
            "channel": ['# sig-gcp', '# community-feedback'],
            "nodeWeightUpLimit": "1000",
            "nodeWeightDownLimit": "0",
            "edgeWeightUpLimit": "1",
            "edgeWeightDownLimit": "1",
            "keywords": ["https://github.com/kubernetes/kubernetes.github.io"],
            "dateDownLimit": "0000000000000",
            "dateUpLimit": "9999999999999",
            "ifconclude": "0"
        };
        var number_of_nodes = xmlfile.getElementsByTagName('node').length;
        var number_of_edges = xmlfile.getElementsByTagName('edge').length;
        var number_of_channels = 1;
        changeDiagram(number_of_channels, number_of_nodes, number_of_edges, conditions);
    }

}

function changeDiagram(number_of_channels, node_number, edge_number, conditions) {
    changeidNumber("#node_number", node_number);
    changeidNumber("#edge_number", edge_number);
    var dom = document.getElementById("main");
    var myChart = echarts.init(dom);
    var app = {};
    option = null;
    app.title = 'FLUO';


    var xml = filter(rawGraph, conditions);
    // var oSerializer = new XMLSerializer();
    // var s = oSerializer.serializeToString(xml);
    // var a = f(s);
    // for (i = 0; i < a.length; i++) console.log(a[i]);
    console.log(xml);
    var graph = echarts.dataTool.gexf.parse(xml);
    //console.log("graph",graph);
    var categories = [];
    for (var i = 0; i < number_of_channels; i++) {
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
    var option;
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

    console.log('succeed!');
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
    console.log("xml", xmlFile);
    var nodes = xmlFile.getElementsByTagName('node');
    var links = xmlFile.getElementsByTagName('edge');
    var graph = new Graph();
    // return nodes[1];
    for (var i = 0; i < nodes.length; i++) {
        var channel = [];
        var attvalues = nodes[i].getElementsByTagName("attvalue");
        for (var j = 2; j < attvalues.length; j++) channel.push(attvalues[j].getAttribute("value"));
        if (nodes[i].getAttribute("label") === "Null") continue;
        var node = new Node(nodes[i].getAttribute("id"),   //Edge(id, source, target, weight, channel, date, message)
            nodes[i].getAttribute("lable"),
            attvalues[0].getAttribute("value"),
            attvalues[1].getAttribute("value"),
            channel);
        graph.addNode(node);
        graph.nodesid[i] = node.id;
    }
    for (var i = 0; i < links.length; i++) {//Edge(id, source, target, weight, channel, date, message)
        var attvalues = links[i].getElementsByTagName("attvalue");
        var edge = new Link(links[i].getAttribute("id"),
            links[i].getAttribute("source"),
            links[i].getAttribute("target"),
            links[i].getAttribute("weight"),
            attvalues[0].getAttribute("value"),
            attvalues[1].getAttribute("value"),
            attvalues[2].getAttribute("value"));
        graph.addLink(edge);
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
    var time = new Date();
    var newgraph = new Graph();

    //读取

    var selectNodes = []; //通过一层筛选的node在nodes中的坐标
    var selectNodesid = [];
    var selectNodes1 = []; //通过复筛的node在nodes中的坐标
    var selectLink = [];
    //console.log(time.toLocaleTimeString());
    //对note进行筛选
    for (var i = 0; i < graph.nodes.length; i++) {
        var t = new Boolean();
        t = false;
        //判断在不在channel
        for (var j = 0; j < graph.nodes[i].channel.length; j++) {
            var index = $.inArray(graph.nodes[i].channel[j], channelChoose);
            //console.log(j,index);
            if (index != -1) {
                t = true;
                // console.log(graph.nodes[i].channel[j]);
                break;
            }
        }
        var weight = parseInt(graph.nodes[i].weight);
        if ((t == true) && (weight >= nodeWeightDownLimit) && (weight <= nodeWeightUpLimit)) {
            selectNodes.push(i);
            selectNodesid.push(graph.nodes[i].id);
        }

    }
    //console.log(selectNodes);
    //console.log(time.toLocaleTimeString());
    //对edge进行筛选
    for (i = 0; i < graph.links.length; i++) {
        var t = new Boolean();
        t = false;
        var index1 = $.inArray(graph.links[i].channel, channelChoose);
        var index2 = $.inArray(graph.links[i].source, selectNodesid);
        var index3 = $.inArray(graph.links[i].target, selectNodesid);
        var date = graph.links[i].data;
        if (index1 != -1) {
            //在不在所属channel
            if ((index2 != -1) || (index3 != -1)) {                                         //源点和目标点是否囊括所筛节点
                var weight = parseInt(graph.links[i].weight);
                if ((weight <= edgeWeightUpLimit) && (weight >= edgeWeightDownLimit)) {   //weight范围是否合理

                    //if ((date<=dateUpLimit)&&(date>=dateDownLimit)){
                    if (keywords.length != 0) {
                        for (j = 0; j < keywords.length; j++) {
                            if (graph.links[i].message.indexOf(keywords[j]) != -1) {           //是否包含关键字
                                t = true;
                                break
                            }
                        }
                    }
                    if ((keywords.length == 0) || (ifconclude == false && t == false) || (ifconclude == true && t == true)) { //判断是否满足关键词的包含关系
                        newgraph.addLink(graph.links[i]);
                        var targetindex = $.inArray(graph.links[i].target, newgraph.nodesid);
                        var sourceindex = $.inArray(graph.links[i].source, newgraph.nodesid)
                        if (targetindex == -1) newgraph.addNode(graph.nodes[$.inArray(graph.links[i].target, graph.nodesid)]);
                        if (sourceindex == -1) newgraph.addNode(graph.nodes[$.inArray(graph.links[i].source, graph.nodesid)]);

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
    //     newNode.setAttribute("lable", graph.nodes[i].lable);
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
    //console.log(selectNodes1);
    for (i = 0; i < newgraph.nodes.length; i++) {
        //console.log(newNode);
        newNodes.appendChild(graph.makeNode(newgraph.nodes[i]));
    }
    y.parentNode.removeChild(y);
    xmlfile.getElementsByTagName("graph")[0].appendChild(newNodes);

    //console.log(selectEdge);
    //删除edge
    var newEdges = xmlfile.createElement("edges");
    y = xmlfile.getElementsByTagName("edges")[0];
    for (i = 0; i < newgraph.links.length; i++) {

        newEdges.appendChild(graph.makeEdge(newgraph.links[i]));
        //console.log(newEdge);
    }
    y.parentNode.removeChild(y);
    xmlfile.getElementsByTagName("graph")[0].appendChild(newEdges);
    // console.log(time.toLocaleTimeString());
    return xmlfile;
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
    this.links = [];
    this.nodes = [];
    this.nodesid = [];
}

Graph.prototype.addLink = function (newLink) {
    this.links.push(newLink);
}
Graph.prototype.addNode = function (newNode) {
    this.nodes.push(newNode);
    this.nodesid.push(newNode.id);
}
Graph.prototype.getNode = function (i) {
    return this.nodes[i];
}

Graph.prototype.getLink = function (i) {
    return this.links[i];
}
Graph.prototype.linkslength = function () {
    return this.links.length;
}
Graph.prototype.nodeslength = function () {
    return this.nodes.length;
}
Graph.prototype.isnode = function (id) {
    var t = new Boolean();
    t = false;
    for (var i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i].id == id) {
            t = true;
            break;
        }
    }
    return t;
}
Graph.prototype.getnodebyid = function (id) {
    for (var i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i].id = id) return this.nodes[i];
    }
    return null;
}
Graph.prototype.makeNode = function (graphnode) {
    var newNode = xmlfile.createElement("node");
    newNode.setAttribute("id", graphnode.id);
    newNode.setAttribute("lable", graphnode.lable);
    newNode.setAttribute("xmlns", s);
    var attvalues = xmlfile.createElement("attvalues");
    var attvalue = xmlfile.createElement("attvalue");
    attvalue.setAttribute("for", "weight");
    attvalue.setAttribute("value", graphnode.weight);
    attvalues.appendChild(attvalue);
    newNode.appendChild(attvalues);
    return newNode;
}
Graph.prototype.makeEdge = function (graphedge) {
    var newEdge = xmlfile.createElement("edge");
    newEdge.setAttribute("id", graphedge.id);
    newEdge.setAttribute("xmlns", s);
    newEdge.setAttribute("source", graphedge.source);
    newEdge.setAttribute("target", graphedge.target);
    newEdge.setAttribute("weight", graphedge.weight);
    var attvalues = xmlfile.createElement("attvalues");
    var attvalue = xmlfile.createElement("attvalue");
    attvalue.setAttribute("for", "weight");
    attvalue.setAttribute("value", graphedge.weight);
    attvalues.appendChild(attvalue);
    newEdge.appendChild(attvalues);
    return newEdge;
}

function Link(id, source, target, weight, channel, date, message) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.weight = weight;
    this.channel = channel;
    this.date = date;
    this.message = message;
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
Link.prototype.getWeight = function () {
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


function Node(id, lable, date, weight, channel) {
    this.id = id;
    this.lable = lable;
    var dateObject = new Date(date);
    this.date = dateObject;
    this.weight = weight;
    this.channel = channel;
}

Node.prototype.getid = function () {
    return this.id;
}
Node.prototype.getlable = function () {
    return this.lable;
}
Node.prototype.getdate = function () {
    return this.date;
}
Node.prototype.getweight = function () {
    return this.weight;
}
Node.prototype.getchannel = function () {
    return this.channel;
}

function loadXMLDoc(dname) {

    if (window.XMLHttpRequest) {
        xhttp = new XMLHttpRequest();
    }
    else {
        xhttp = new ActiveXObject("Microsoft.XMLDOM");
    }

    xhttp.open("GET", dname, false);
    xhttp.send();
    console.log(xhttp.responseXML)
    return xhttp.responseXML;

}

function f(s) {
    var a = [];
    a.push(s.slice(0, 80));
    if (s.length > 80) a = a.concat(f(s.slice(80)));
    return a;
}












