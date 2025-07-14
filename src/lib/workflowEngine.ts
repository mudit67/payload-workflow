import { getPayload } from 'payload'

export class WorkflowEngine {
  private payload: any

  constructor(payload: any) {
    this.payload = payload
  }

  async processDocument(
    collectionSlug: string,
    documentId: string,
    documentData: any,
    workflowId?: number,
  ) {
    try {
      // Get the workflow for this collection
      let workflow
      if (workflowId) {
        workflow = await this.payload.findByID({
          collection: 'workflows',
          id: workflowId,
        })
      } else {
        const workflows = await this.payload.find({
          collection: 'workflows',
          where: {
            collection_name: { equals: collectionSlug },
          },
          limit: 1,
        })

        if (workflows.docs.length === 0) {
          console.log(`No workflow found for collection: ${collectionSlug}`)
          return
        }

        workflow = workflows.docs[0]
      }

      console.log(`Processing workflow for document ${documentId} in collection ${collectionSlug}`)

      // console.log('Workflow Steps:', workflow.steps)

      // Process each step in the workflow
      for (let stepIndex = 0; stepIndex < workflow.steps.length; stepIndex++) {
        const step = workflow.steps[stepIndex]

        // Check if step conditions are met (if any)
        const conditionsMet = await this.evaluateStepConditions(step, documentData)

        // console.log(50, conditionsMet, documentData)

        // if (conditionsMet) {
        // Create or update workflow status for this step
        await this.updateWorkflowStatus(workflow.id, documentId, step.id, conditionsMet)
      }
      // }
    } catch (error) {
      console.error('Error processing workflow:', error)
    }
  }

  // Add this helper function to extract text from rich text content
  private extractTextFromRichText(richTextData: any): string {
    if (!richTextData) return ''

    // Handle Lexical rich text format
    if (typeof richTextData === 'object' && richTextData.root) {
      return this.extractTextFromLexical(richTextData.root)
    }

    // Handle other rich text formats or plain text
    if (typeof richTextData === 'string') {
      // Remove HTML tags if it's HTML string
      return richTextData.replace(/<[^>]*>/g, '').trim()
    }

    // Handle array format (some rich text editors use arrays)
    if (Array.isArray(richTextData)) {
      return richTextData
        .map((item) => {
          if (typeof item === 'string') return item
          if (item.text) return item.text
          if (item.children) return this.extractTextFromRichText(item.children)
          return ''
        })
        .join(' ')
        .trim()
    }

    return ''
  }

  private extractTextFromLexical(node: any): string {
    if (!node) return ''

    let text = ''

    // Handle text nodes
    if (node.type === 'text') {
      return node.text || ''
    }

    // Handle nodes with children
    if (node.children && Array.isArray(node.children)) {
      text = node.children.map((child: any) => this.extractTextFromLexical(child)).join('')
    }

    // Add spacing for block elements
    if (node.type === 'paragraph' || node.type === 'heading') {
      text += ' '
    }

    return text
  }

  // Update the getFieldValue method to handle rich text
  private getFieldValue(data: any, fieldPath: string): any {
    const value = fieldPath.split('.').reduce((obj, key) => obj?.[key], data)

    // Check if this might be a rich text field by examining the structure
    if (value && typeof value === 'object' && (value.root || Array.isArray(value))) {
      // This looks like rich text content, extract the text
      return this.extractTextFromRichText(value)
    }

    return value
  }

  // Update the evaluateCondition method to handle rich text properly
  private evaluateCondition(fieldValue: any, operator: string, desiredValue: string): boolean {
    // Convert rich text to plain text if needed
    let textValue = fieldValue
    if (typeof fieldValue === 'object' && fieldValue !== null) {
      textValue = this.extractTextFromRichText(fieldValue)
    }

    console.log('Text Value: ', textValue)
    console.log('operator ', operator)

    switch (operator) {
      case 'text:length:equals':
        return String(textValue || '').length === parseInt(desiredValue)
      case 'text:length:greaterThanEqualsTo':
        return String(textValue || '').length >= parseInt(desiredValue)
      case 'text:length:lessThanEqualsTo':
        return String(textValue || '').length <= parseInt(desiredValue)
      case 'text:length:greaterThan':
        return String(textValue || '').length > parseInt(desiredValue)
      case 'text:length:lessThan':
        return String(textValue || '').length < parseInt(desiredValue)
      case 'text:startsWith':
        return String(textValue || '')
          .toLowerCase()
          .startsWith(desiredValue.toLowerCase())
      case 'text:endsWith':
        return String(textValue || '')
          .toLowerCase()
          .endsWith(desiredValue.toLowerCase())
      case 'text:contains':
        return String(textValue || '')
          .toLowerCase()
          .includes(desiredValue.toLowerCase())
      case 'number:equals':
        return Number(textValue) === Number(desiredValue)
      case 'number:greaterThanEqualsTo':
        return Number(textValue) >= Number(desiredValue)
      case 'number:lessThanEqualsTo':
        return Number(textValue) <= Number(desiredValue)
      case 'number:greaterThan':
        return Number(textValue) > Number(desiredValue)
      case 'number:lessThan':
        return Number(textValue) < Number(desiredValue)
      case 'checkBox:equals':
        return Boolean(textValue) === (desiredValue.toLowerCase() === 'true')
      case 'date:equals':
        return new Date(textValue).getTime() === new Date(desiredValue).getTime()
      case 'date:greaterThanEqualsTo':
        return new Date(textValue) >= new Date(desiredValue)
      case 'date:lessThanEqualsTo':
        return new Date(textValue) <= new Date(desiredValue)
      case 'date:greaterThan':
        return new Date(textValue) > new Date(desiredValue)
      case 'date:lessThan':
        return new Date(textValue) < new Date(desiredValue)
      default:
        console.warn(`Unknown operator: ${operator}`)
        return false
    }
  }

  private async evaluateStepConditions(step: any, documentData: any): Promise<boolean> {
    if (!step.field_name || !step.operator || !step.desiredValue) {
      return false
    }

    const fieldValue = this.getFieldValue(documentData, step.field_name)
    return this.evaluateCondition(fieldValue, step.operator, step.desiredValue)
  }

  // private getFieldValue(data: any, fieldPath: string): any {
  //   return fieldPath.split('.').reduce((obj, key) => obj?.[key], data)
  // }

  // private evaluateCondition(fieldValue: any, operator: string, desiredValue: string): boolean {
  //   switch (operator) {
  //     case 'text:length:equals':
  //       return String(fieldValue || '').length === parseInt(desiredValue)
  //     case 'text:length:greaterThanEqualsTo':
  //       return String(fieldValue || '').length >= parseInt(desiredValue)
  //     case 'text:length:lessThanEqualsTo':
  //       return String(fieldValue || '').length <= parseInt(desiredValue)
  //     case 'text:length:greaterThan':
  //       return String(fieldValue || '').length > parseInt(desiredValue)
  //     case 'text:length:lessThan':
  //       return String(fieldValue || '').length < parseInt(desiredValue)
  //     case 'text:startsWith':
  //       return String(fieldValue || '')
  //         .toLowerCase()
  //         .startsWith(desiredValue.toLowerCase())
  //     case 'text:endsWith':
  //       return String(fieldValue || '')
  //         .toLowerCase()
  //         .endsWith(desiredValue.toLowerCase())
  //     case 'text:contains':
  //       return String(fieldValue || '')
  //         .toLowerCase()
  //         .includes(desiredValue.toLowerCase())
  //     case 'number:equals':
  //       return Number(fieldValue) === Number(desiredValue)
  //     case 'number:greaterThanEqualsTo':
  //       return Number(fieldValue) >= Number(desiredValue)
  //     case 'number:lessThanEqualsTo':
  //       return Number(fieldValue) <= Number(desiredValue)
  //     case 'number:greaterThan':
  //       return Number(fieldValue) > Number(desiredValue)
  //     case 'number:lessThan':
  //       return Number(fieldValue) < Number(desiredValue)
  //     case 'checkBox:equals':
  //       return Boolean(fieldValue) === (desiredValue.toLowerCase() === 'true')
  //     case 'date:equals':
  //       return new Date(fieldValue).getTime() === new Date(desiredValue).getTime()
  //     case 'date:greaterThanEqualsTo':
  //       return new Date(fieldValue) >= new Date(desiredValue)
  //     case 'date:lessThanEqualsTo':
  //       return new Date(fieldValue) <= new Date(desiredValue)
  //     case 'date:greaterThan':
  //       return new Date(fieldValue) > new Date(desiredValue)
  //     case 'date:lessThan':
  //       return new Date(fieldValue) < new Date(desiredValue)
  //     default:
  //       console.warn(`Unknown operator: ${operator}`)
  //       return false
  //   }
  // }

  private async updateWorkflowStatus(
    workflowId: string,
    docId: string,
    stepId: string,
    // step: any,
    stepStatus: boolean,
    // documentData: any,
  ) {
    try {
      // Check if workflow status already exists for this document and step
      const existingStatus = await this.payload.find({
        collection: 'workflowStatus',
        where: {
          and: [
            { workflow_id: { equals: workflowId } },
            { doc_id: { equals: docId } },
            { step_id: { equals: stepId } },
          ],
        },
        limit: 1,
      })

      const statusData = {
        workflow_id: workflowId,
        doc_id: docId,
        step_id: stepId,
        step_status: stepStatus ? 'approved' : 'pending',
      }

      if (existingStatus.docs.length > 0) {
        // Update existing status
        if (existingStatus.docs[0].step_status == 'approved') {
          stepStatus = true
        }
        await this.payload.update({
          collection: 'workflowStatus',
          id: existingStatus.docs[0].id,
          data: {
            step_status: stepStatus ? 'approved' : 'pending',
            updatedAt: new Date(),
          },
        })
        console.log(`Updated workflow status for document ${docId}, step ${stepId}: ${stepStatus}`)
      } else {
        // Create new status
        await this.payload.create({
          collection: 'workflowStatus',
          data: statusData,
        })
        console.log(`Created workflow status for document ${docId}, step ${stepId}: ${stepStatus}`)
      }
    } catch (error) {
      console.error('Error updating workflow status:', error)
    }
  }

  // Method to manually process all existing documents in a collection
  async processExistingDocuments(collectionSlug: string, workflowId: number) {
    try {
      const documents = await this.payload.find({
        collection: collectionSlug,
        limit: 0, // Get all documents
      })

      console.log(
        `Processing ${documents.docs.length} existing documents for workflow ${workflowId}`,
      )

      for (const doc of documents.docs) {
        await this.processDocument(collectionSlug, doc.id, doc, workflowId)
      }

      console.log(`Finished processing existing documents for workflow ${workflowId}`)
    } catch (error) {
      console.error('Error processing existing documents:', error)
    }
  }
}
