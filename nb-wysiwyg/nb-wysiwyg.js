;(function(){
"use strict";

var ctrlKey = function (event) { return event.metaKey || event.ctrlKey; };

var commandsToKeyboardShortcutsMap = Object.freeze({
  bold: function (event) { return event.metaKey && event.keyCode === 66; }, // b
  italic: function (event) { return event.metaKey && event.keyCode === 73; }, // i
  strikeThrough: function (event) { return event.altKey && event.shiftKey && event.keyCode === 83; }, // s
  removeFormat: function (event) { return event.altKey && event.shiftKey && event.keyCode === 65; }, // a
  linkPrompt: function (event) { return event.metaKey && ! event.shiftKey && event.keyCode === 75; }, // k
  unlink: function (event) { return event.metaKey && event.shiftKey && event.keyCode === 75; }, // k,
  insertUnorderedList: function (event) { return event.altKey && event.shiftKey && event.keyCode === 66; }, // b
  insertOrderedList: function (event) { return event.altKey && event.shiftKey && event.keyCode === 78; }, // n
  blockquote: function (event) { return event.altKey && event.shiftKey && event.keyCode === 87; }, // w
  code: function (event) { return event.metaKey && event.shiftKey && event.keyCode === 76; }, // l
  h2: function (event) { return ctrlKey(event) && event.keyCode === 50; } // 2
});

var _btn_bars = [
  [
    {name: "bold", label: "Bold", icon: "bold"},
    {name: "italic", label: "Italic", icon: "italic"},
    {name: "strikeThrough", label: "Strike Through", icon: "strikethrough"},
    {name: "removeFormat", label: "Remove Formatting", icon: "eraser"}
  ],
  [
    {name: "linkPrompt", label: "Link", icon: "link"},
    {name: "unlink", label: "Unlink", icon: "unlink"}
  ],
  [
    {name: "insertOrderedList", label: "Ordered List", icon: "list-ol"},
    {name: "insertUnorderedList", label: "Unordered List", icon: "list-ul"},
    {name: "indent", label: "Indent", icon: "indent"},
    {name: "outdent", label: "Outdent", icon: "outdent"}
  ],
  [
    {name: "blockquote", label: "Blockquote", icon: "quote-left"},
    {name: "code", label: "Code", icon: "code"}
  ],
  [
    {label: "header", icon: "header"},
    {name: "h1", label: "H1", text: "1"},
    {name: "h2", label: "H2", text: "2"},
    {name: "h3", label: "H3", text: "3"},
    {name: "h4", label: "H4", text: "4"},
    {name: "h5", label: "H5", text: "5"},
    {name: "h6", label: "H6", text: "6"}
  ],
  [
    {name: "undo", label: "Undo", icon: "undo"},
    {name: "redo", label: "Redo", icon: "repeat"}
  ]
];


var _bc = '/nbextensions/nb-wysiwyg/lib/',
  _cfg = {
    paths: {
      he: _bc + "he/he",
      toMarkdown: _bc + "to-markdown/dist/to-markdown"
    }
  },

  _scribe = function(plugin){
    var comp = "scribe" + (plugin ? "-plugin-" + plugin : "");
    _cfg.paths[comp] = _bc + comp + '/' + comp;
    return comp;
  };

require(_cfg, [
    'jquery',
    'underscore',

    'base/js/namespace',
    'notebook/js/textcell',

    'toMarkdown',
    'components/marked/lib/marked',

    _scribe(),

    _scribe('blockquote-command'),
    _scribe('code-command'),
    _scribe('curly-quotes'),
    _scribe('formatter-plain-text-convert-new-lines-to-html'),
    _scribe('heading-command'),
    _scribe('intelligent-unlink-command'),
    _scribe('keyboard-shortcuts'),
    _scribe('link-prompt-command'),
    _scribe('sanitizer'),
    _scribe('smart-lists'),
    _scribe('toolbar')
  ], function (
    $, _,
    IPython, textCell,
    toMarkdown, marked,
    Scribe,
    scribePluginBlockquoteCommand,
    scribePluginCodeCommand,
    scribePluginCurlyQuotes,
    scribePluginFormatterPlainTextConvertNewLinesToHtml,
    scribePluginHeadingCommand,
    scribePluginIntelligentUnlinkCommand,
    scribePluginKeyboardShortcuts,
    scribePluginLinkPromptCommand,
    scribePluginSanitizer,
    scribePluginSmartLists,
    scribePluginToolbar
  ) {

  $("head").append($("<link/>", {
    rel: "stylesheet",
    type: "text/css",
    href: "/nbextensions/nb-wysiwyg/nb-wysiwyg.css"
  }));

  $([IPython.events]).on('edit_mode.Cell', function(evt, data){
    var cell = data.cell;
    if(!(cell instanceof textCell.MarkdownCell)){ return; }

    if(cell.scribe){ return; }

    var ia = cell.element.find(".input_area"),
      wysiwyg = $("<div/>", {"class": "scribe"}).appendTo(ia),
      tb = $("<div/>", {"class": "btn-toolbar"}).appendTo(wysiwyg),
      el = $("<div/>").appendTo(wysiwyg),

      cm = cell.code_mirror,
      scribe = cell.scribe = new Scribe(el[0]),

      sChange = function(){
        if(cm.hasFocus()){ return; }
        cm.setValue(toMarkdown(scribe.getHTML()));
      },

      cmChange = function(_cm, change) {
        if(change && change.origin == 'setValue'){ return; }
        scribe.setHTML(marked.parse(cm.getValue()));
        setTimeout(function(){
          cm.display.input.blur();
          cm.focus();
        }, 0);
      };

    scribe.on('content-changed', sChange);
    cm.on('change', cmChange);

    cmChange();

    IPython.keyboard_manager.register_events(el);

    // set up toolbar
    _btn_bars.map(function(bar){
      var $bar = $("<div/>", {"class": "btn-group"})
        .appendTo(tb);
      bar.map(function(btn){
        var $btn = $("<button/>", {
            "data-command-name": btn.name,
            "class": "btn btn-sm btn-default",
            "title": btn.label
          })
          .text(btn.text)
          .appendTo($bar);
        if(btn.icon){
          $btn.append($("<i/>", {
            "class": "fa fa-" + btn.icon
          }));
        }
      });
    });

    // set up scribe stuff
    scribe.use(scribePluginBlockquoteCommand());
    scribe.use(scribePluginCodeCommand());
    [1,2,3,4,5,6].map(function(i){
      scribe.use(scribePluginHeadingCommand(i));
    });
    scribe.use(scribePluginIntelligentUnlinkCommand());
    scribe.use(scribePluginLinkPromptCommand());
    scribe.use(scribePluginToolbar(tb[0]));
    scribe.use(scribePluginSmartLists());
    scribe.use(scribePluginCurlyQuotes());
    scribe.use(scribePluginKeyboardShortcuts(commandsToKeyboardShortcutsMap));

    // Formatters
    scribe.use(scribePluginSanitizer({
      tags: {
        p: {},
        br: {},
        b: {},
        strong: {},
        i: {},
        strike: {},
        blockquote: {},
        code: {},
        ol: {},
        ul: {},
        li: {},
        a: { href: true },
        h1: {},
        h2: {},
        h3: {},
        h4: {},
        h5: {},
        h6: {}
      }
    }));
    scribe.use(scribePluginFormatterPlainTextConvertNewLinesToHtml());

  });
});


})();
