import ShallowNestedGraph from './shallow-graph'
import DeepNestedGraphNode from './deep-node'

export default class DeepNestedGraph extends ShallowNestedGraph {
  setNodes (graphData) {
    this.setNodesAs(graphData, node => {
      return new DeepNestedGraphNode(node, this.reverse)
    })
  }

  selectLayout (layoutData) {
    const data = layoutData.deep
    return this.reverse ? data.reverse : data.standard
  }

  appendChildPathToParentsOf (targetTp) {
    for (const parentTpPath of targetTp.parentTpPaths()) {
      const parentTp = this.findNodeByPath(parentTpPath)
      parentTp.children.push(targetTp.path)
    }
  }

  existParentTpInSameRootNode (targetTpPath) {
    return this.nodes
      .filter(d => d.rootNodePath === this.currentRootNodePath)
      .find(d => d.children.find(p => p === targetTpPath))
  }

  splitTp (ownerNode, targetTpPaths) {
    // console.log(`  *** split tp on ${ownerNode.path}, parents = `, targetTpPaths)
    for (const targetTpPath of targetTpPaths) {
      const targetTp = this.findNodeByPath(targetTpPath)
      if (!this.existParentTpInSameRootNode(targetTpPath)) {
        continue
      }
      const splitTargetTp = targetTp.splitTpOn(ownerNode)
      this.appendChildPathToParentsOf(splitTargetTp)
      ownerNode.parents.push(splitTargetTp.path)
      this.nodes.push(splitTargetTp)
    }
  }

  // childNode = target (to split)
  splitNode (parentNode, childNode) {
    // console.log(`  ** child: ${childNode.path} has ${childNode.numberOfParentNodes()} parent nodes : `, childNode.parents)
    if (parentNode.split <= 0 && childNode.numberOfParentNodes() <= 1) {
      return childNode
    }
    // console.log('  ** child has multi-parents -> split')
    const splitChildNode = childNode.splitNodeByParent(parentNode.path)
    this.nodes.push(splitChildNode)
    // console.log(`  ** splitChild : `, splitChildNode)
    parentNode.renameChildPath(childNode.path, splitChildNode.path)
    // console.log(`  ** parent :`, parentNode)
    this.splitTp(splitChildNode, childNode.parentTpPaths())
    return splitChildNode
  }

  checkLeafNode (node) {
    return node.childNodePaths().length < 1
  }

  childNodePathsToCalcPosition (node) {
    return node.childNodePaths()
  }

  childNodeFrom (parentNode, childNodePath) {
    const childNode = this.findNodeByPath(childNodePath)
    if (!childNode) {
      console.error(`child ${childNodePath} not found in ${parentNode.path}`)
    }
    // split multi-parents child node to single parent node
    return this.splitNode(parentNode, childNode)
  }

  widthByChildNodes (node, childrenWHList) {
    return this.nodeXPad * 2 +
      childrenWHList.reduce((sum, d) => { return sum + d.width }, 0) +
      this.nodeXPad * (node.childNodePaths().length - 1)
  }
}
