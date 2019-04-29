import ShallowNestedGraphNode from './shallow-node'

export default class DeepNestedGraphNode extends ShallowNestedGraphNode {
  constructor (nodeData, reverse) {
    super(nodeData, reverse)
    this.split = 'split' in nodeData ? nodeData.split : 0
  }

  renameChildPath (oldChildPath, newChildPath) {
    // operation for parent node of multiple-parents node
    // (change child info)
    this.children = this.children
      .filter(d => d !== oldChildPath)
      .concat(newChildPath)
  }

  duplicate () {
    this.split++
    return new DeepNestedGraphNode(this)
  }

  splitTpOn (ownerNode) {
    const splitTp = this.duplicate()
    splitTp.path = `${ownerNode.path}/${this.name}::${this.split}`
    splitTp.children = this.childTpPaths().concat(ownerNode.path)
    splitTp.parents = this.parents
    return splitTp
  }

  splitNodeByParent (parentNodePath) {
    const splitNode = this.duplicate()
    splitNode.path = `${this.path}::${this.split}`
    // overwrite children and parents (selected by reverse flag in constructor)
    splitNode.children = this.children
    splitNode.parents = [ parentNodePath ]
    this.parents = this.parents.filter(d => d !== parentNodePath)
    return splitNode
  }
}
