import { NextResponse } from 'next/server'

// In a real production application, this should be generated automatically
// by extending your existing Zod schemas using @asteasolutions/zod-to-openapi.
// For this MVP, we provide a static OpenAPI document for the new v1 routes.

export async function GET() {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Benangbaju API',
      version: '1.0.0',
      description: 'API endpoints for external consumers (Mobile App, ERP Sync)',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid payload' },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
      },
    },
    paths: {
      '/products': {
        get: {
          summary: 'List Products',
          description: 'Retrieve a paginated list of active products.',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'q', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } },
              },
            },
          },
        },
      },
      '/orders': {
        post: {
          summary: 'Create Order',
          description: 'Create a new order. Required Bearer token.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { type: 'object' } },
                    shippingAddressId: { type: 'string' },
                    courier: { type: 'string' },
                    service: { type: 'string' },
                    shippingCost: { type: 'integer' },
                    paymentMethod: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Order created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/inventory/sync': {
        post: {
          summary: 'Bulk Sync Inventory',
          description: 'Update stock levels for multiple SKUs. Requires API Key.',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    updates: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          sku: { type: 'string' },
                          stock: { type: 'integer' },
                        },
                        required: ['sku', 'stock'],
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Inventory synced successfully',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } },
              },
            },
            '401': {
              description: 'Unauthorized - Invalid API Key',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
    },
  }

  return NextResponse.json(openApiSpec)
}
