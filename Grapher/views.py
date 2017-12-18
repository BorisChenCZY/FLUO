from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from .Database_conductor import *

# Create your views here.
def index(request):
    return render(request, 'index.html')


def pic(request, dir):
    print(dir)
    return None


def xml(request, team, channels):

    content = convert('T09NY5SBT', channels_list=['C6WB33KNJ'])
    print('converted')
    return HttpResponse(content)

def convert(team,channels_list,graph='mention_based_graph_info',user = 'read_database',pwd = 'FluoBySusTech',port=3306,host = '10.20.13.209',dbname='rowdata'):
    from gexf import Gexf
    from textblob import TextBlob
    import random
    import pymysql
    try:
        con = pymysql.Connect(
            host=host,  # 远程登录主机的ip地址
            port=port,  # mysql服务器的端口
            user=user,  # mysql的用户
            passwd=pwd,  # 密码
            db=dbname  # 需要的数据库名称
        )
        # 获取本次的游标
        cur = con.cursor()
    except pymysql.Error as e:
        print("Error %d: %s" % (e.args[0], e.args[1]))

    gexf = Gexf("Gephi.org", "A Web network")

    output = gexf.addGraph("directed", "static", "A Web network")

    # channel_list=list()
    people_id = dict()
    teams_id = dict()
    channels_id = dict()
    people_channel_relation_id = dict()
    team_channel_relation_id = dict()
    channel_team_relation_id = dict()
    id_list = ['channels', 'teams', 'people', 'people_channel_relation', 'team_channel_relation']
    for id in id_list:
        cur.execute('select * from ' + id)
        data = cur.fetchall()
        if id == 'team_channel_relation':
            for i in data:
                channel_team_relation_id[i[1]] = i[0]
        for i in data:
            exec(id + '_id[\'' + i[0] + '\']=i[1]')

    channel_node = output.addNodeAttribute(force_id="Channel", title="channel", type="String")
    team_node = output.addNodeAttribute(force_id="Team", title="team", type="String")
    weight_node = output.addNodeAttribute(force_id="Weight", title="weight", type="float")

    for tem_id in people_id.keys():
        # tem_id=p[0]
        # print(people_id[tem_id])
        tem_name = people_id[tem_id]
        tem_channel = people_channel_relation_id[tem_id]
        tem_team = channel_team_relation_id[tem_channel]
        if tem_team==team and tem_channel in channels_list:
            tmp_node = output.addNode(tem_id, tem_name)
            tmp_node.addAttribute(channel_node, channels_id[tem_channel])
            tmp_node.addAttribute(team_node, teams_id[tem_team])
            tmp_node.addAttribute(weight_node, str(int(100 * random.random())))

    msg_att = output.addEdgeAttribute(force_id="Message", title="message", type='String', defaultValue='None')
    weight_att = output.addEdgeAttribute(force_id="Weight", title="weight", type='float', defaultValue='0')
    date_att = output.addEdgeAttribute(force_id="Date", title="date", type='float', defaultValue='None')
    channel_att = output.addEdgeAttribute(force_id="Channel", title="channel", type='String', defaultValue='None')
    team_att = output.addEdgeAttribute(force_id="Team", title="team", type='String', defaultValue='None')

    cur.execute('select * from ' + graph)
    data = cur.fetchall()
    cc=0
    for tem_m in data:
        sender, receiver, text, channel_id, team_id, ts = tem_m
        if team_id == team and channel_id in channels_list:
            blob = TextBlob(text)
            weight = str(blob.sentiment.polarity)
            # weight = str(10 * random.random())
            try:
                tem_edge = output.addEdge(sender + receiver+str(cc), sender, receiver, weight=weight)
            except Exception:
                # continue  # todo change it !
                tmp_node = output.addNode(receiver, 'Null')
                tem_edge = output.addEdge(sender + receiver+str(cc), sender, receiver, weight=weight)

            cc=cc+1
            tem_edge.addAttribute(msg_att, text)
            tem_edge.addAttribute(weight_att, weight)
            tem_edge.addAttribute(date_att, str(ts))
            tem_edge.addAttribute(channel_att, channels_id[channel_id])
            tem_edge.addAttribute(team_att, teams_id[team_id])


    output_file = open("./test.gexf", "wb")
    gexf.write(output_file)
    output_file.close()
    with open("./test.gexf", 'rb') as f:
        return f.read().decode('utf-8')



# convert('T024HV01E',channels_list=['C024HV01L','C08C4GYQ0'])
def channels(request, team):
    database_conductor = Database_conductor(True)
    team_info = {}
    for _, channel in (database_conductor.get_channels_from_team('T09NY5SBT')):
        channel, channel_name = (database_conductor.get_channel_detail(channel)[0])
        team_info[channel] = channel_name
    print(team_info)
    return JsonResponse(team_info)
