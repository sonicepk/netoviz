'use strict'

import * as d3 from 'd3'
import {ForceSimulator} from './force-simulator'

export class SingleGraphVisualizer {
  constructor (graph, findAllNodeFunc) {
    this.graph = graph
    this.setCavasSize()
    this.visContainer = d3.select('body')
      .select('div#visualizer')
      .append('div')
      .attr('class', 'networklayer')
    this.findGraphNodeByPath = findAllNodeFunc
  }

  makeToolTip () {
    return this.visContainer
      .append('div')
      .attr('class', 'tooltip')
  }

  makeNetworkLayer () {
    return this.visContainer
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g') // topology graph container
      .attr('id', this.graph.name)
      .attr('class', 'network')
  }

  makeClearButton () {
    return this.nwLayer.append('g')
      .attr('class', 'clearbutton')
      .append('text')
      .attr('x', 10)
      .attr('y', 20)
      .text('[clear all selection/highlight]')
  }

  makeLinkObjects () {
    return this.nwLayer.append('g')
      .attr('class', 'link')
      .selectAll('line')
      .data(this.graph.links)
      .enter()
      .append('line')
      .attr('id', d => d.path)
  }

  makeTpObjects () {
    return this.nwLayer.append('g')
      .attr('class', 'terminalpoints')
      .selectAll('circle.tp')
      .data(this.graph.tpTypeNodes())
      .enter()
      .append('circle')
      .attr('class', 'tp')
      .attr('id', d => d.path)
  }

  makeNodeObjects () {
    return this.nwLayer.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.graph.nodeTypeNodes())
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('id', d => d.path)
  }

  makeNodeCircleObjects () {
    return this.nwLayer.append('g')
      .attr('class', 'nodecircles')
      .selectAll('circle.nodecircle')
      .data(this.graph.nodeTypeNodes())
      .enter()
      .append('circle')
      .attr('class', 'nodecircle')
      .attr('id', d => d.path + '.bg')
  }

  makeTpLabelObjects () {
    return this.nwLayer.append('g')
      .attr('class', 'tplabels')
      .selectAll('text.tplabel')
      .data(this.graph.tpTypeNodes())
      .enter()
      .append('text')
      .attr('class', 'tplabel')
      .attr('id', d => d.path + '.tplb')
      .text(d => d.name)
  }

  makeNodeLabelObjects () {
    return this.nwLayer.append('g')
      .attr('class', 'nodelabels')
      .selectAll('text.nodelabel')
      .data(this.graph.nodeTypeNodes())
      .enter()
      .append('text')
      .attr('class', 'nodelabel')
      .attr('id', d => d.path + '.ndlb')
      .text(d => d.name)
  }

  setCavasSize () {
    var graphSize = this.graph.nodes.length
    // small
    this.width = 400
    this.height = 400
    if (graphSize > 50) {
      // large
      this.width = 2000
      this.height = 1000
    } else if (graphSize >= 20 && graphSize < 50) {
      // medium
      this.width = 800
      this.height = 800
    }
  }

  renameLinkKey () {
    this.graph.links.forEach(d => {
      d.source = d.sourceId
      d.target = d.targetId
    })
  }

  draw () {
    this.renameLinkKey()

    this.nwLayer = this.makeNetworkLayer()
    this.tooltip = this.makeToolTip()
    this.clearBtn = this.makeClearButton()
    this.link = this.makeLinkObjects()
    this.nodeCircle = this.makeNodeCircleObjects()
    this.node = this.makeNodeObjects()
    this.tp = this.makeTpObjects()
    this.tpLabel = this.makeTpLabelObjects()
    this.nodeLabel = this.makeNodeLabelObjects()

    this.simulator = new ForceSimulator({
      'height': this.height,
      'width': this.width,
      'graph': this.graph,
      'link': this.link,
      'tp': this.tp,
      'node': this.node,
      'nodecircle': this.nodeCircle,
      'tplabel': this.tpLabel,
      'nodelabel': this.nodeLabel
    })

    // set event callback for tp/node
    this.setEventCallBack(
      [this.tp, this.node, this.nodeCircle, this.tpLabel, this.nodeLabel]
    )
    this.setClearButtonEventCallback()
  }

  setEventCallBack (objs) {
    var self = this // alias to use event callback closure

    function clearElementHighlight (element) {
      ['selectedchildren', 'selectedparents', 'selected'].forEach(
        d => element.classList.remove(d)
      )
    }

    function pathObjType (path) {
      if (path.match(/.+\/.+\/.+/)) {
        return 'tp'
      }
      return 'node'
    }

    function pathBody (path) {
      // remove each id(path) suffix
      return path.replace(/\.(bg|ndlb|tplb)$/, '')
    }

    function highlightElementsByPath (path) {
      if (pathObjType(path) === 'tp') {
        return [
          document.getElementById(path),
          document.getElementById(path + '.tplb')
        ]
      }
      // pathObjType === 'node'
      return [
        document.getElementById(path + '.bg'),
        document.getElementById(path + '.ndlb')
      ]
    }

    // highlight selected node
    function highlightNodeByPath (direction, path) {
      highlightElementsByPath(path).forEach(element => {
        clearElementHighlight(element)
        if (direction === 'children') {
          element.classList.add('selectedchildren')
        } else if (direction === 'parents') {
          element.classList.add('selectedparents')
        } else {
          element.classList.add('selected')
        }
      })
    }

    // event callback
    function highlightNode (element) {
      function findSupportingObj (direction, path) {
        // highlight DOM
        console.log('....', direction, path)
        highlightNodeByPath(direction, path)
        // find nodes to highlight via through *all* layers
        var node = self.findGraphNodeByPath(path)
        if (node[direction]) {
          // search children/parent recursively
          node[direction].forEach(
            d => findSupportingObj(direction, d)
          )
        }
      }
      // highlight selected object and its children/parents
      var path = pathBody(element.getAttribute('id'))
      console.log('highlight_top: ', path)
      findSupportingObj('children', path)
      findSupportingObj('parents', path)
      findSupportingObj('clicked', path) // dummy direction
    }

    function mouseOver (element) {
      var path = pathBody(element.id)
      // set highlight style
      highlightElementsByPath(path).forEach(elm => {
        elm.classList.add('selectready')
        // enable tooltip
        var header = path
        var node = self.findGraphNodeByPath(path)
        if (node && Object.keys(node.attribute).length > 0) {
          header = header + node.attribute.toHtml()
        }
        self.tooltip
          .style('visibility', 'visible')
          .html(header)
      })
    }

    function mouseMove (element) {
      self.tooltip
        .style('top', d3.event.pageY - 20 + 'px')
        .style('left', (d3.event.pageX + 30) + 'px')
    }

    function mouseOut (element) {
      var path = pathBody(element.id)
      // remove highlight style
      highlightElementsByPath(path).forEach(elm => {
        elm.classList.remove('selectready')
        // disable tooltip
        self.tooltip
          .style('visibility', 'hidden')
      })
    }

    // set event callbacks
    objs.forEach(obj => {
      // use `function() {}` NOT arrow-function `() => {}`.
      // arrow-function bind `this` according to decrared position
      obj
        .on('click', function () { highlightNode(this) })
        .on('mouseover', function () { mouseOver(this) })
        .on('mousemove', function () { mouseMove(this) })
        .on('mouseout', function () { mouseOut(this) })
        .call(d3.drag()
          .on('start', self.simulator.dragstarted)
          .on('drag', self.simulator.dragged)
          .on('end', self.simulator.dragended))
    })
  }

  setClearButtonEventCallback () {
    function clearHighlight () {
      // clear all highlighted object
      var element = document.getElementById('visualizer');
      ['selectedchildren', 'selectedparents', 'selected'].forEach(d => {
        var selectedElements = element.getElementsByClassName(d)
        Array.from(selectedElements).forEach(element => {
          element.classList.remove(d)
        })
      })
    }

    // set event callback for clear button
    // NOTICE: `this`
    this.clearBtn
      .on('click', clearHighlight)
      .on('mouseover', function () {
        this.classList.add('selectready')
      })
      .on('mouseout', function () {
        this.classList.remove('selectready')
      })
  }
}