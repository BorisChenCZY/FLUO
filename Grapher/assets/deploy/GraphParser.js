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
t = true;
var xmlfile;
var s = "http://www.gephi.org/gexf/1.2draft";
var conditions = {
    "channel": ['C4YCQ57CG', 'C6WB33KNJ'],
    "nodeWeightUpLimit": "1000",
    "nodeWeightDownLimit": "0",
    "edgeWeightUpLimit": "1",
    "edgeWeightDownLimit": "-1",
    "keywords": ["https://github.com/kubernetes/kubernetes.github.io"],
    "dateDownLimit": "0000000000000",
    "dateUpLimit": "9999999999999",
    "ifconclude": "0"
}
loaded_channels = {};


function reload_channels() {
    loaded_channels = {};
}

function draws(team, channels) {
    var channel_xmls = new Array();
    for (var index in channels) {
        if (channels[index] in Object.keys(loaded_channels))
            get_graph_xml(team, channels[index]);
        channel_xmls.push(loaded_channels[channels[index]])

    }
    var obj = new Object();
    //a[1] = loadXMLDoc(filename2);
    obj = filter(merge(channel_xmls), conditions);

    draw(obj);
}

function merge(channelxml_Array) {
    var graph = new Graph();
    for (var i = 0; i < channelxml_Array.length; i++) {
        var channelGraph = creatGraph(channelxml_Array[i]);
        graph.addGraph(channelGraph);
    }

    return graph;
}

function draw(obj) {
    var xml = obj.xml;
    var node_number = obj.node_number;
    var edge_number = obj.edge_number;
    changeidNumber("#node_number", node_number);
    changeidNumber("#edge_number", edge_number);
    var dom = document.getElementById("main");
    var myChart = echarts.init(dom);
    var app = {};
    option = null;
    app.title = 'FLUO';

    // var oSerializer = new XMLSerializer();
    // var s = oSerializer.serializeToString(xml);
    // var a = f(s);
    // for (i = 0; i < a.length; i++) console.log(a[i]);
    var graph = echarts.dataTool.gexf.parse(xml);
    //console.log("graph",graph);
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
    var nodes = xmlFile.getElementsByTagName('node');
    var links = xmlFile.getElementsByTagName('edge');
    var graph = new Graph();

    for (i = 0; i < nodes.length; i++) {
        var channel = new Array();
        var attvalues = nodes[i].getElementsByTagName("attvalue");
        if (attvalues.length != 0) {
            for (j = 2; j < attvalues.length; j++) channel.push(attvalues[j].getAttribute("value"));
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
            var index = $.inArray(node.getchannel()[channel]/*graph.nodes[i].channel[j]*/, channelChoose);
            //console.log(j,index);
            if (index != -1) {
                t = true;
                // console.log(graph.nodes[i].channel[j]);
                break;
            }
        }
        var weight = parseInt(node.weight);
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
                        for (j = 0; j < keywords.length; j++) {
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
    console.log(xmlfile.getElementsByTagName("nodes"));
    for (var node in newgraph.getNodes()/*i = 0; i < newgraph.nodes.length; i++*/) {
        //console.log(newNode);
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
    console.log(newgraph);
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
        xhttp = new XMLHttpRequest();
    }
    else {
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
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
