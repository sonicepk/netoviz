'use strict'

import * as d3 from 'd3'

export class ForceSimulator {
  constructor (data) {
    var tpSize = 10 // tp circle radius
    var nodeSize = 40 // node width/height
    this.graph = data.graph

    // functions to set parameters for simulation
    function linkDistance (d) {
      if (d.type === 'node-tp') {
        return nodeSize
      }
      return 2 * nodeSize // tp-tp (inter node)
    }

    function ticked () {
      data.link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      data.tp
        .attr('r', tpSize)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

      data.node
        .attr('r', nodeSize * 0.7)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

      data.nodecircle
        .attr('r', nodeSize)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

      data.tplabel
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('dx', 1.5 * tpSize / 2) // offset to click tp easily

      data.nodelabel
        .attr('x', d => d.x)
        .attr('y', d => d.y)
    }

    this.simulation = d3.forceSimulation()
      .force('link',
        d3.forceLink()
          .id(d => d.id)
          .distance(linkDistance)
          .iterations(8)
      )
      .force('collide',
        d3.forceCollide()
          .strength(1.0) // collision not allowed
          .iterations(8)
      )
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(data.width / 2, data.height / 2))

    this.simulation
      .nodes(this.graph.nodes)
      .on('tick', ticked)
      .force('link')
      .links(this.graph.links)

    // event callbacks for node/tp object (mouse dragging)
    // notice use arrow-function `() => {}' NOT `function(){}`
    // TO BIND `this`
    this.dragstarted = d => {
      if (!d3.event.active) {
        this.simulation.alphaTarget(0.3).restart()
      }
      d.fx = d.x
      d.fy = d.y
    }

    this.dragged = d => {
      d.fx = d3.event.x
      d.fy = d3.event.y
    }

    this.dragended = d => {
      if (!d3.event.active) {
        this.simulation.alphaTarget(0)
      }
      d.fx = null
      d.fy = null
    }
  }
}