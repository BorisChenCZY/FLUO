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
var dom = document.getElementById("main");
var myChart = echarts.init(dom);

var current_graph = {};
var max_node_weight = 0;
var max_edge_weight = 1;
var last_node_number = undefined;
var last_edge_number = undefined;

myChart.on('click', function (param) {
    var type = param['data'].type;
    if (type === 'node') {
        var id = param['data'].id;
        get_person(id);
        open_sidebar('sidebar-vertex', 'sidebar-edge');
        $('#sidebar-vertex').pxSidebar('update');
    } else {
        var source = param['data'].source;
        var target = param['data'].target;
        get_edge(source, target);
        open_sidebar('sidebar-edge', 'sidebar-vertex')
        $('#sidebar-edge').pxSidebar('update');
    }
})

function clear_draw_area() {

    myChart.clear();
    $('#easy-pie-chart-1').attr('data-max-value', 0).data('easy-pie-chart').update(0);
    $('#easy-pie-chart-2').attr('data-max-value', 0).data('easy-pie-chart').update(0);
    last_edge_number = undefined
    last_node_number = undefined
    $('.panel.box').attr('class', 'panel box invisible')
    return
}

function draws(team, channels) {
    var channel_xmls = [];
    // console.log(team);
    // console.log(channels);
    if (channels.length === 0) {
        clear_draw_area()
    }
    myChart.showLoading();
    for (var index = 0; index < channels.length; index++) {
        var channel = channels[index];
        if ((jQuery.inArray(channel, Object.keys(loaded_channels))) === -1) {
            get_graph_xml(team, channel, function (ret) {
                loaded_channels[channel] = ret;
                channel_xmls.push(loaded_channels[channel]);
                if (channel_xmls.length === channels.length) {
                    xmlfile = channel_xmls[0].implementation.createDocument(channel_xmls[0].namespaceURI, null, null);
                    var newNode = xmlfile.importNode(channel_xmls[0].documentElement, true);
                    xmlfile.appendChild(newNode);
                    current_graph = merge(channel_xmls)
                    draw(current_graph, conditions);

                }
            });
        } else {
            channel_xmls.push(loaded_channels[channel]);
            if (channel_xmls.length === channels.length) {
                xmlfile = channel_xmls[0].implementation.createDocument(channel_xmls[0].namespaceURI, null, null);
                var newNode = xmlfile.importNode(channel_xmls[0].documentElement, true);
                xmlfile.appendChild(newNode);
                current_graph = merge(channel_xmls)
                draw(current_graph, conditions);
            }
        }
    }
}

function merge(channelxml_Array) {
    //  console.log('this is it ', channelxml_Array)
    var graph = new Graph();
    for (var i = 0; i < channelxml_Array.length; i++) {
        // console.log(channelxml_Array[i])
        console.log(channelxml_Array[i])
        var channelGraph = createGraph(channelxml_Array[i]);

        graph.addGraph(channelGraph);
    }

    return graph;
}

function draw(current_graph, conditions = '') {
    var on_draw_graph = filter(current_graph, conditions)
    var xml = on_draw_graph.xml;
    var node_number = on_draw_graph.node_number;
    var edge_number = on_draw_graph.edge_number;
    console.log('on_draw', xml)
    if (node_number === last_node_number && edge_number === last_edge_number)
        return
    last_edge_number = edge_number
    last_node_number = node_number

    $('#easy-pie-chart-1').attr('data-max-value', node_number).data('easy-pie-chart').update(0);
    $('#easy-pie-chart-1').attr('data-max-value', node_number).data('easy-pie-chart').update(100);
    $('#easy-pie-chart-2').attr('data-max-value', edge_number).data('easy-pie-chart').update(0);
    $('#easy-pie-chart-2').attr('data-max-value', edge_number).data('easy-pie-chart').update(100);

    var dom = document.getElementById("main");
    // myChart = echarts.init(dom);
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
        node.type = 'node';
        if (node.name != 'slackbot' && node.attributes.weight > max_node_weight) {
            max_node_weight = node.attributes.weight
            // console.log('updated', max_node_weight)
            // console.log(node)
        }
    });

    graph.links.forEach(function (edge) {
        edge.type = 'edge';
        // edge.name = '233'
        // console.log(edge)
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
    myChart.hideLoading();


    $("#bs-slider-edge").slider({min: -1, max: parseInt(max_edge_weight), range: [-1, parseInt(max_edge_weight)]})
    // $("#bs-slider-edge").slider('setValue', [-1, parseInt(max_edge_weight)])
    $("#bs-slider-edge-div .pull-xs-right").html(max_edge_weight)
    $("#bs-slider-node").slider({min: 0, max: parseInt(max_node_weight), range: [0, parseInt(max_node_weight)],})
    // $("#bs-slider-node").slider('setValue', [-1, parseInt(max_node_weight)])
    $("#bs-slider-node-div .pull-xs-right").html(max_node_weight)
    $('.panel.box').attr('class', 'panel box')
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


function createGraph(xmlFile) {
    //console.log(xmlFile)
    var nodes = xmlFile.getElementsByTagName('node');
    var links = xmlFile.getElementsByTagName('edge');
    var graph = new Graph();

    for (var i = 0; i < nodes.length; i++) {
        //    console.log(nodes)
        var channel = new Array();
        var attvalues = nodes[i].getElementsByTagName("attvalue");
        if (attvalues.length != 0) {
            for (var j = 2; j < attvalues.length; j++) channel.push(attvalues[j].getAttribute("value"));
            var node = new Node(nodes[i].getAttribute("id"),   //Node(id, label, team, weight, channel)
                nodes[i].getAttribute("label"),
                attvalues[1].getAttribute("value"),
                parseInt(attvalues[0].getAttribute("value")),
                channel);
            graph.addNode(node);
            // if (node.weight > max_node_weight)
            //     max_node_weight = node.weight
            // console.log(node.weight)
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
            if (links[i].getAttribute("weight") > max_edge_weight) {
                max_edge_weight = links[i].getAttribute("weight");
            }
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
        var weight = parseInt(node.weight);
        // console.log(nodekey, weight, t)
        if ((weight >= nodeWeightDownLimit) && (weight <= nodeWeightUpLimit)) {
            selectNodesid.push(node.id);
        }

    }

    //对edge进行筛选
    for (var linkkey in graph.getLinks()) {
        var link = graph.getLinks()[linkkey];
        var t = new Boolean();//是否包含关键字，t为true时包含
        t = false;
        var index2 = $.inArray(link.getsource(), selectNodesid);
        var index3 = $.inArray(link.gettarget(), selectNodesid);
        var date = link.getdate();
        //在不在所属channel
        if ((index2 != -1) && (index3 != -1)) {                                         //源点和目标点是否囊括所筛节点
            var weight = parseFloat(link.getweight());
            // console.log('second', weight)
            if ((weight <= edgeWeightUpLimit) && (weight >= edgeWeightDownLimit)) {   //weight范围是否合理
                if (keywords.length != 0) {
                    for (var j = 0; j < keywords.length; j++) {
                        if (link.getmessage().indexOf(keywords[j]) != -1) {           //是否包含关键字
                            t = true;
                            break
                        }
                    }
                }
                if (((keywords.length == 0) || (ifconclude == false && t == false) || (ifconclude == true && t == true)) && (link.getsource() != link.gettarget())) {
                    if (newgraph.getNodes()[link.gettarget()] == null) newgraph.addNode(graph.getNode(link.gettarget()));
                    if (newgraph.getNodes()[link.getsource()] == null) newgraph.addNode(graph.getNode(link.getsource()));
                    newgraph.addLink(link);
                    //}
                }
            }
            //}
            //  }
        }
    }
    //console.log("newgraph in filter",newgraph);

    //替换
    //node
    //edge

    //删除node
    var newNodes = xmlfile.createElement("nodes");
    var y = xmlfile.getElementsByTagName("nodes")[0];

    for (var node in newgraph.getNodes()) {
        newNodes.appendChild(graph.makeNode(newgraph.getNodes()[node]));
    }
    y.parentNode.removeChild(y);
    xmlfile.getElementsByTagName("graph")[0].appendChild(newNodes);

    var newEdges = xmlfile.createElement("edges");
    y = xmlfile.getElementsByTagName("edges")[0];
    for (var link in newgraph.getLinks()) {

        var new_edge = graph.makeEdge(newgraph.getLinks()[link])
        // console.log(new_edge.getAttribute('weight'))
        // if (new_edge.getAttribute('weight') >= conditions.edgeWeightDownLimit && new_edge.getAttribute('weight') <= new_edge.getAttribute('weight'))
        newEdges.appendChild(new_edge);

    }
    y.parentNode.removeChild(y)
    xmlfile.getElementsByTagName("graph")[0].appendChild(newEdges);

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
    // console.log(this.weight)
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
