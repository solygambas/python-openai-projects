# Creating node class
class Node:
    def __init__(self, data):
        self.data = data
        self.leftChild = None
        self.rightChild = None

    def insert(self, data):
        if data < self.data:
            if self.leftChild:
                self.leftChild.insert(data)
            else:
                self.leftChild = Node(data)
                return
        else:
            if self.rightChild:
                self.rightChild.insert(data)
            else:
                self.rightChild = Node(data)
                return

    def search(self, val):
        if val == self.data:
            return str(val) + " is found in the BST"
        elif val < self.data:
            if self.leftChild:
                return self.leftChild.search(val)
            else:
                return str(val) + " is not found in the BST"
        else:
            if self.rightChild:
                return self.rightChild.search(val)
            else:
                return str(val) + " is not found in the BST"

    def PrintTree(self):
        if self.leftChild:
            self.leftChild.PrintTree()
        print(self.data),
        if self.rightChild:
            self.rightChild.PrintTree()


root = Node(27)
root.insert(14)
root.insert(35)
root.insert(31)
root.insert(10)
root.insert(19)


print(root.search(7))
print(root.search(14))
