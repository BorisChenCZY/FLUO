from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from .Database_conductor import *
import random
from pprint import pprint
import os

dir_path = os.path.dirname(os.path.realpath(__file__))

# Create your views here.
def index(request):
    return render(request, 'index.html')


def pic(request, dir):
    print(dir)
    return None


def xml(request, team, channel):
    path = dir_path + "/mention_based/{}_{}.gexf".format(team, channel)
    if not os.path.isfile(path):
        convert(team, channels_list=[channel])
    with open(path, 'rb') as f:
        content = f.read().decode('utf-8')
    print('converted')
    return HttpResponse(content)


# coding: utf-8
def convert(team_name, channels_list, graph='mention_based_graph_info', user='read_database', pwd='FluoBySusTech',
            port=3306, host='10.20.13.209', dbname='rowdata'):
    from gexf import Gexf
    from textblob import TextBlob
    import random
    import pymysql
    import pandas as pd

    try:
        con = pymysql.Connect(
            host=host,  # 远程登录主机的ip地址
            port=port,  # mysql服务器的端口
            user=user,  # mysql的用户
            passwd=pwd,  # 密码
            db=dbname,  # 需要的数据库名称
        )
        # 获取本次的游标
        cur = con.cursor()
    except pymysql.Error as e:
        print("Error %d: %s" % (e.args[0], e.args[1]))

    cur.execute('select * from team_channel_relation ')
    team_to_channel = cur.fetchall()
    team_to_channel = list(map(list, zip(*team_to_channel)))
    team = team_to_channel[0][:]
    channel = team_to_channel[1][:]
    team_to_channel = {'team': team, 'channel': channel}
    team_to_channel = pd.DataFrame(team_to_channel)
    del team
    del channel

    for channel_file in channels_list:

        gexf = Gexf("Gephi.org", "A Web network")

        output = gexf.addGraph("directed", "static", "A Web network")

        cur.execute('select * from people_channel_relation where channel_id = \'' + channel_file + '\' ')
        person_and_channel = cur.fetchall()

        if len(person_and_channel) == 0:
            output_file = open(".\graphdata_of_" + channel_file + ".gexf", "wb")
            gexf.write(output_file)
            output_file.close()

        else:

            person_and_channel = list(map(list, zip(*person_and_channel)))
            person = person_and_channel[0][:]
            channel = person_and_channel[1][:]
            person_and_channel = {'person': person, 'channel': channel}
            person_and_channel = pd.DataFrame(person_and_channel)
            del person
            del channel

            person_list = person_and_channel['person']

            # print(person_and_channel)

            channel_node = output.addNodeAttribute(force_id="Channel", title="channel", type="String")
            team_node = output.addNodeAttribute(force_id="Team", title="team", type="String")
            weight_node = output.addNodeAttribute(force_id="Weight", title="weight", type="float")

            people_id = dict()
            #            id_list = ['people']
            #            for id in id_list:
            #                cur.execute('select * from ' + id)
            #                data = cur.fetchall()
            #                for i in data:
            #                    exec(id + '_id[\'' + i[0] + '\']=i[1]')
            #                    print('id', id)

            person_set = set(person_list)
            person_to_channel = []
            for tem_person in person_set:
                cur.execute('select * from people_channel_relation where people_id = \'' + tem_person + '\' ')

                person_to_channel = person_to_channel + list(cur.fetchall())

            person_to_channel = list(map(list, zip(*person_to_channel)))
            person = person_to_channel[0][:]
            channel = person_to_channel[1][:]
            person_to_channel = {'person': person, 'channel': channel}
            person_to_channel = pd.DataFrame(person_to_channel)

            # print(person_to_channel)

            cc = 0
            num2333 = len(person_set)
            for tem_id in person_set:
                #                print(cc / num2333)
                try:
                    tem_name = people_id[tem_id]
                except KeyError:
                    tem_name = "Null"

                tem_channel_list = set(person_to_channel[person_to_channel['person'] == tem_id]['channel'])

                tmp_node = output.addNode(tem_id, tem_name)
                tmp_node.addAttribute(weight_node, str(int(100 * random.random())))
                tem_team_list = set()
                for tem_channel in tem_channel_list:
                    # cur.execute('select team_id from team_channel_relation where channel_id = \'' + tem_channel + '\'')
                    # tem_team_list = cur.fetchall()
                    tem_team_list = tem_team_list | set(
                        team_to_channel[team_to_channel['channel'] == tem_channel]['team'])
                for tem_team in tem_team_list:
                    tmp_node.addAttribute(team_node, tem_team)

                for tem_channel in tem_channel_list:
                    tmp_node.addAttribute(channel_node, tem_channel)

                cc = cc + 1

            m = 'mention_based_graph_info'
            cur.execute('select * from ' + m + ' where channel_id = \'' + channel_file + '\' ')
            data = cur.fetchall()

            msg_att = output.addEdgeAttribute(force_id="Message", title="message", type='String', defaultValue='None')
            weight_att = output.addEdgeAttribute(force_id="Weight", title="weight", type='float', defaultValue='0')
            date_att = output.addEdgeAttribute(force_id="Date", title="date", type='float', defaultValue='None')
            channel_att = output.addEdgeAttribute(force_id="Channel", title="channel", type='String',
                                                  defaultValue='None')
            team_att = output.addEdgeAttribute(force_id="Team", title="team", type='String', defaultValue='None')
            cc = 0
            numhehe = len(data)
            for tem_m in data:
                #                print(cc / numhehe)
                sender, receiver, text, channel_id, team_id, ts = tem_m
                blob = TextBlob(text)
                weight = str(blob.sentiment.polarity)
                try:
                    tem_edge = output.addEdge(sender + receiver + str(cc), sender, receiver, weight=weight)
                except Exception:
                    try:
                        tmp_node = output.addNode(receiver, 'Null')
                        tem_edge = output.addEdge(sender + receiver + str(cc), sender, receiver, weight=weight)
                    except Exception:
                        tmp_node = output.addNode(sender, 'Null')
                        tem_edge = output.addEdge(sender + receiver + str(cc), sender, receiver, weight=weight)

                cc = cc + 1
                tem_edge.addAttribute(msg_att, text)
                tem_edge.addAttribute(weight_att, weight)
                tem_edge.addAttribute(date_att, str(ts))
                tem_edge.addAttribute(team_att, team_id)
                tem_edge.addAttribute(channel_att, channel_id)


            output_file = open(dir_path + "/mention_based/{}_{}.gexf".format(team_name, channel_file), "wb")
            gexf.write(output_file)
            output_file.close()


def channels(request, team):
    database_conductor = Database_conductor(True)
    team_info = {}
    for _, channel in (database_conductor.get_channels_from_team(team)):
        channel, channel_name = (database_conductor.get_channel_detail(channel)[0])
        team_info[channel] = channel_name
    print(team_info)
    return JsonResponse(team_info)


def teams(request):
    database_conductor = Database_conductor(True)
    team_info = {}
    for id, name, domain in database_conductor.get_teams():
        team_info[id] = {"name": name, "domain": domain}
    return JsonResponse(team_info)


def get_person_info(id):
    database_conductor = Database_conductor(True)
    id, username, first_name, last_name, _, img_192, img_original = database_conductor.get_person(id)[0]
    messages = []
    for _, channel_id, text, team_id, ts in (database_conductor.get_person_messages(id)):
        message = {'channel_id': channel_id,
                   'channel_name': database_conductor.get_channel_detail(channel_id)[0][1],
                   "text": text,
                   "team_id": team_id,
                   "ts": ts,
                   }
        messages.append(message)
    weight = random.random()
    mentions = len(database_conductor.get_mentioned(id))
    return {
        "id": id,
        "username": username,
        "first_name": first_name,
        "last_name": last_name,
        "img_192": img_192,
        "img_original": img_original,
        "messages": messages,
        "weight": weight,
        "mention": mentions,
    }


def get_edge_info(node1, node2):
    database_conductor = Database_conductor(True)
    id, username, first_name, last_name, _, img_192, img_original = database_conductor.get_person(node1)[0]
    node1_basic_info = {
        "id": id,
        "username": username,
        "first_name": first_name,
        "last_name": last_name,
        "img_192": img_192,
        "img_original": img_original,
    }
    id, username, first_name, last_name, _, img_192, img_original = database_conductor.get_person(node2)[0]
    node2_basic_info = {
        "id": id,
        "username": username,
        "first_name": first_name,
        "last_name": last_name,
        "img_192": img_192,
        "img_original": img_original,
    }
    messages = list(database_conductor.get_message_from_to(node1, node2))
    messages += list(database_conductor.get_message_from_to(node2, node1))
    return_messages = list()
    for sender, receiver, text, channel_id, team_id, ts in sorted(messages, key=lambda x: x[-1]):
        message = {
            'sender': sender,
            'receiver': receiver,
            'channel_id': channel_id,
            'channel_name': database_conductor.get_channel_detail(channel_id)[0][1],
            "text": text,
            "team_id": team_id,
            "ts": ts,
        }
        return_messages.append(message)
    return {
        "node1": node1_basic_info,
        "node2": node2_basic_info,
        "messages": return_messages,
    }


def person(request, id):
    # get_person_info(id)
    return JsonResponse(get_person_info(id))


def edge(request, node1, node2):
    return JsonResponse(get_edge_info(node1, node2))


