import 'package:paper/src/extensions/extensions.dart';

class Document {
  final String title;
  final List<Map<String, dynamic>> content;

  Document({
    required this.title,
    required this.content,
  });
}

Map<String, dynamic> parseDocument(Document doc) {
  return {
    'type': 'doc',
    'content': [
      {
        'type': 'title',
        'content': doc.title.isEmpty
            ? []
            : [
                {
                  'type': 'text',
                  'text': doc.title,
                }
              ],
      },
      ..._parseDocumentBlocks(doc.content),
    ],
  };
}

List<Map<String, dynamic>> _parseDocumentBlocks(
  List<Map<String, dynamic>> blocks,
) {
  return blocks.map((node) {
    if (node.containsKey('heading')) {
      return {
        'type': 'heading',
        'attrs': {
          'level': node['heading']['level'],
        },
        'content': _parseDocumentInlines(_listMap(node['heading']['content'])),
      };
    } else if (node.containsKey('paragraph')) {
      return {
        'type': 'paragraph',
        'content': _parseDocumentInlines(
          _listMap(node['paragraph']['content']),
        ),
      };
    } else if (node.containsKey('blockquote')) {
      return {
        'type': 'blockquote',
        'content': _parseDocumentBlocks(
          _listMap(node['blockquote']['content']),
        ),
      };
    } else if (node.containsKey('ordered_list')) {
      return {
        'type': 'ordered_list',
        'content': _parseDocumentListItems(
          _listMap(node['ordered_list']['content']),
        ),
      };
    } else if (node.containsKey('bullet_list')) {
      return {
        'type': 'bullet_list',
        'content': _parseDocumentListItems(
          _listMap(node['bullet_list']['content']),
        ),
      };
    } else if (node.containsKey('todo_list')) {
      return {
        'type': 'todo_list',
        'content': _parseDocumentTodoItems(
          _listMap(node['todo_list']['content']),
        ),
      };
    } else if (node.containsKey('code_block')) {
      return {
        'type': 'code_block',
        'attrs': {'language': node['code_block']['language']},
        'content': _parseDocumentInlines(
          _listMap(node['code_block']['content']),
        ),
      };
    } else if (node.containsKey('image_block')) {
      return {
        'type': 'image_block',
        'attrs': {
          'src': node['image_block']['src'],
          'caption': node['image_block']['caption'],
        },
      };
    } else if (node.containsKey('video_block')) {
      return {
        'type': 'video_block',
        'attrs': {
          'src': node['video_block']['src'],
          'caption': node['video_block']['caption'],
        },
      };
    } else {
      throw Exception('Unknown block node $node');
    }
  }).toList();
}

List<Map<String, dynamic>> _parseDocumentInlines(
  List<Map<String, dynamic>> inlines,
) {
  return inlines.map((node) {
    if (node.containsKey('text')) {
      final marks = [];
      final text = node['text'] as Map<String, dynamic>;

      if (text.containsKey('bold') && text['bold'] == true) {
        marks.add({'type': 'bold'});
      }
      if (text.containsKey('italic') && text['italic'] == true) {
        marks.add({'type': 'italic'});
      }
      if (text.containsKey('underline') && text['underline'] == true) {
        marks.add({'type': 'underline'});
      }
      if (text.containsKey('strikethrough') && text['strikethrough'] == true) {
        marks.add({'type': 'strikethrough'});
      }
      if (text.containsKey('code') && text['code'] == true) {
        marks.add({'type': 'code'});
      }
      if (text.containsKey('link')) {
        final Map<String, dynamic>? link = text['link'];
        if (link != null && link.containsKey('href')) {
          marks.add({
            'type': 'link',
            'attrs': {'href': link['href']},
          });
        }
      }

      return {
        'type': 'text',
        'text': node['text']['text'],
        'marks': marks,
      };
    } else {
      throw Exception('Unknown inline node $node');
    }
  }).toList();
}

List<Map<String, dynamic>> _parseDocumentListItems(
  List<Map<String, dynamic>> items,
) {
  return items.map((item) {
    if (item.containsKey('list_item')) {
      return {
        'type': 'list_item',
        'content': _parseDocumentBlocks(_listMap(item['list_item']['content'])),
      };
    } else {
      throw Exception('Unknown list item $item');
    }
  }).toList();
}

List<Map<String, dynamic>> _parseDocumentTodoItems(
  List<Map<String, dynamic>> items,
) {
  return items.map((item) {
    if (item.containsKey('todo_item')) {
      return {
        'type': 'todo_item',
        'attrs': {'checked': item['todo_item']['checked']},
        'content': _parseDocumentBlocks(_listMap(item['todo_item']['content'])),
      };
    } else {
      throw Exception('Unknown todo item $item');
    }
  }).toList();
}

Document parseProsemirror(Map<String, dynamic> doc) {
  if (!doc.containsKey('type') || doc['type'] != 'doc') {
    throw Exception('Unknown doc $doc');
  }

  final content = _listMap(doc['content']);
  final title = content.firstOrNull?['type'] == 'title'
      ? content.first['content'][0]['text']
      : '';

  return Document(
    title: title,
    content: _parseProsemirrorBlocks(content.sublist(1)),
  );
}

List<Map<String, dynamic>> _parseProsemirrorBlocks(
  List<Map<String, dynamic>> blocks,
) {
  return blocks.map((node) {
    switch (node['type']) {
      case 'heading':
        return {
          'heading': {
            'level': node['attrs']['level'],
            'content': _parseProsemirrorInlines(
              _listMap(node['content'] ?? []),
            ),
          },
        };
      case 'paragraph':
        return {
          'paragraph': {
            'content': _parseProsemirrorInlines(
              _listMap(node['content'] ?? []),
            ),
          },
        };
      case 'blockquote':
        return {
          'blockquote': {
            'content': _parseProsemirrorBlocks(
              _listMap(node['content'] ?? []),
            ),
          },
        };
      case 'ordered_list':
        return {
          'ordered_list': {
            'content': _parseProsemirrorListItems(
              _listMap(node['content'] ?? []),
            ),
          },
        };
      case 'bullet_list':
        return {
          'bullet_list': {
            'content': _parseProsemirrorListItems(
              _listMap(node['content'] ?? []),
            ),
          },
        };
      case 'todo_list':
        return {
          'todo_list': {
            'content': _parseProsemirrorTodoItems(
              _listMap(node['content'] ?? []),
            ),
          },
        };
      case 'code_block':
        return {
          'code_block': {
            'language': node['attrs']['language'],
            'content': _parseProsemirrorInlines(
              _listMap(node['content'] ?? []),
            ),
          },
        };
      case 'image_block':
        return {
          'image_block': {
            'src': node['attrs']['src'],
            'caption': node['attrs']['caption'],
          },
        };
      case 'video_block':
        return {
          'video_block': {
            'src': node['attrs']['src'],
            'caption': node['attrs']['caption'],
          },
        };
      default:
        throw Exception('Unknown block node $node');
    }
  }).toList();
}

List<Map<String, dynamic>> _parseProsemirrorInlines(
  List<Map<String, dynamic>> inlines,
) {
  return inlines.map((node) {
    if (node['type'] == 'text') {
      final text = {'text': node['text']};
      final marks = _listMap(node['marks'] ?? []);

      for (final mark in marks) {
        switch (mark['type']) {
          case 'bold':
            text['bold'] = true;
            break;
          case 'italic':
            text['italic'] = true;
            break;
          case 'underline':
            text['underline'] = true;
            break;
          case 'strikethrough':
            text['strikethrough'] = true;
            break;
          case 'code':
            text['code'] = true;
            break;
          case 'link':
            text['link'] = {'href': mark['attrs']['href']};
            break;
          default:
            throw Exception('Unknown mark $mark');
        }
      }

      return {'text': text};
    } else {
      throw Exception('Unknown inline node $node');
    }
  }).toList();
}

List<Map<String, dynamic>> _parseProsemirrorListItems(
  List<Map<String, dynamic>> items,
) {
  return items.map((node) {
    switch (node['type']) {
      case 'list_item':
        return {
          'list_item': {
            'content': _parseProsemirrorBlocks(_listMap(node['content'])),
          },
        };
      default:
        throw Exception('Unknown list item $node');
    }
  }).toList();
}

List<Map<String, dynamic>> _parseProsemirrorTodoItems(
  List<Map<String, dynamic>> items,
) {
  return items.map((node) {
    switch (node['type']) {
      case 'todo_item':
        return {
          'todo_item': {
            'checked': node['attrs']['checked'] == true,
            'content': _parseProsemirrorBlocks(_listMap(node['content'])),
          },
        };
      default:
        throw Exception('Unknown todo item $node');
    }
  }).toList();
}

List<Map<String, dynamic>> _listMap(List<dynamic> list) {
  return List<Map<String, dynamic>>.from(
    list.map((e) => Map<String, dynamic>.from(e)),
  );
}
