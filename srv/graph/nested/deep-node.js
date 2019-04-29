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

  renameParentPath (oldParentPath, newParentPath) {
    this.parents = this.parents
      .filter(d => d !== oldParentPath)
      .concat(newParentPath)
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
    ownerNode.renameParentPath(this.path, splitTp.path)
    return splitTp
  }

  splitNodeByParent (parentNodePath) {
    const splitNode = this.duplicate()
    splitNode.path = `${this.path}::${this.split}`
    // overwrite children and parents (selected by reverse flag in constructor)
    splitNode.children = this.children
    splitNode.parents = this.parentTpPaths().concat(parentNodePath)
    this.parents = this.parents.filter(d => d !== parentNodePath)
    return splitNode
  }
}
