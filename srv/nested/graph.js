import NestedGraphConstants from './constants'
import GridOperator from './grid-operator'
import NestedGraphNode from './node'
import NestedGraphLink from './link'

export default class NestedGraph extends NestedGraphConstants {
  constructor (graphData) {
    super()
    this.setNodes(graphData)
    this.setLinks(graphData)
    this.setRootNodes()
    this.grid = new GridOperator(4, 4, this.initialGridInterval)
    this.culcRootNodePosition()
  }

  setNodes (graphData) {
    this.nodes = []
    for (const layer of graphData) {
      for (const node of layer.nodes) {
        this.nodes.push(new NestedGraphNode(node))
      }
    }
  }

  setLinks (graphData) {
    this.links = []
    for (const layer of graphData) {
      this.links = this.links.concat(
        layer.links.map(d => new NestedGraphLink(d))
      )
    }
  }

  setRootNodes () {
    this.rootNodes = this.nodes.filter(d => d.isRootNode())
  }

  findNodeByPath (path) {
    return this.nodes.find(d => d.path === path)
  }

  culcRootNodePosition () {
    for (const rootNode of this.rootNodes) {
      const baseOrdinalPosition = this.grid.nextOrdinalPosition()
      const basePosition = this.grid.positionByOrdinal(baseOrdinalPosition)
      rootNode.setGridPosition(baseOrdinalPosition)
      this.culcNodePosition(rootNode, basePosition)
    }
  }

  singleParentChildNodePaths (node) {
    return node.childNodePaths().filter(path => {
      const childNode = this.findNodeByPath(path)
      return childNode.numberOfParentNodes() === 1
    })
  }

  culcNodePosition (node, basePosition) {
    // console.log(`path: ${node.path}`)
    this.culcTpPosition(node, basePosition)

    // if the node is leaf:
    // only counted as child node when it has single parent.
    // if it has multiple parents, it breaks tree structure.
    if (this.singleParentChildNodePaths(node).length < 1) {
      return this.culcLeafNodeWH(node, basePosition)
    }
    // recursive position calculation
    const childrenWHList = this.culcChildNodePosition(node, basePosition)
    return this.culcSubRootNodeWH(node, basePosition, childrenWHList)
  }

  culcChildNodePosition (node, basePosition) {
    const childrenWHList = [] // [{ width: w, height: h }]
    let nx11 = basePosition.x + this.nodeXPad
    const ny1x = basePosition.y + (this.nodeYPad + this.r) * 2

    for (const childNodePath of this.singleParentChildNodePaths(node)) {
      // console.log(`  childrenNodePath: ${childNodePath}`)
      const childNode = this.findNodeByPath(childNodePath)
      // recursive search
      const wh = this.culcNodePosition(childNode, { x: nx11, y: ny1x })
      childrenWHList.push(wh)
      nx11 += wh.width + this.nodeXPad
    }
    return childrenWHList
  }

  culcSubRootNodeWH (node, basePosition, childrenWHList) {
    // width
    const sumChildWidth = childrenWHList.reduce((sum, d) => sum + d.width, 0)
    const allTpWidth = 2 * this.r * node.numberOfTps() +
      this.tpInterval * (node.numberOfTps() - 1) + this.nodeXPad * 2
    let width = this.nodeXPad * (node.numberOfChildNodes() + 1)
    width += sumChildWidth < allTpWidth ? allTpWidth : sumChildWidth
    // height
    const maxChildHeight = Math.max(...childrenWHList.map(d => d.height))
    // (ny1x - ny1) + maxChildHeight
    const height = (this.nodeYPad + this.r) * 2 + maxChildHeight

    node.setRect(basePosition.x, basePosition.y, width, height)
    return { width: width, height: height }
  }

  culcLeafNodeWH (node, basePosition) {
    // console.log(`  return: ${node.path} does not have child node`)
    const tpNum = node.numberOfTps()
    const width = this.nodeXPad * 2 + 2 * this.r * tpNum + this.tpInterval * (tpNum - 1)
    const height = (this.nodeYPad + this.r) * 2

    node.setRect(basePosition.x, basePosition.y, width, height)
    return { width: width, height: height }
  }

  culcTpPosition (node, basePosition) {
    let cx11 = basePosition.x + this.nodeXPad + this.r
    const cy1x = basePosition.y + this.nodeYPad + this.r
    for (const tpPath of node.tpPaths()) {
      const tp = this.findNodeByPath(tpPath)
      tp.setCircle(cx11, cy1x, this.r)
      cx11 += this.r * 2 + this.nodeXPad
    }
  }

  operativeNodes () {
    return this.nodes.filter(node => node.operative)
  }

  operativeLinksIn (operativeNodes) {
    return this.links.filter(link => link.availableIn(operativeNodes))
  }

  toData () {
    const operativeNodes = this.operativeNodes()
    return {
      nodes: operativeNodes,
      links: this.operativeLinksIn(operativeNodes)
    }
  }
}