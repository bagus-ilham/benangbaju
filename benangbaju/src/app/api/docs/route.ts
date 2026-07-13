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
      description:
        'API endpoints for external consumers (Mobile App, ERP Sync).\n\n**Versioning & Deprecation Policy**:\nAll endpoints under `/api/v1` are guaranteed to be stable. If breaking changes are introduced, we will release a `/api/v2` namespace. Deprecated v1 endpoints will remain active for at least 6 months after a deprecation notice is published. All responses include the `x-api-version` header to explicitly state the active version.',
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
      headers: {
        ApiVersionHeader: {
          description: 'The API version of the response.',
          schema: {
            type: 'string',
            example: '1.0',
          },
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
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string' },
              description: 'Category slug',
            },
            {
              name: 'collection',
              in: 'query',
              schema: { type: 'string' },
              description: 'Collection slug',
            },
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search query' },
            {
              name: 'sortBy',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['newest', 'featured', 'price-low', 'price-high', 'popular'],
                default: 'newest',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              headers: {
                'x-api-version': { $ref: '#/components/headers/ApiVersionHeader' },
              },
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
          description: 'Create a new secure order. Requires Bearer token.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    addressId: { type: 'string', description: 'UUID of the user address' },
                    courierName: {
                      type: 'string',
                      description: 'Name of the courier (e.g., JNE, Sicepat)',
                    },
                    shippingCost: { type: 'integer', description: 'Shipping cost in Rupiah' },
                    notes: { type: 'string', description: 'Optional order notes', nullable: true },
                    voucherCode: {
                      type: 'string',
                      description: 'Optional voucher code',
                      nullable: true,
                    },
                    shippingRateId: {
                      type: 'string',
                      description: 'Optional UUID of the specific shipping rate',
                      nullable: true,
                    },
                  },
                  required: ['addressId', 'courierName', 'shippingCost'],
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Order created',
              headers: {
                'x-api-version': { $ref: '#/components/headers/ApiVersionHeader' },
              },
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } },
              },
            },
            '400': {
              description: 'Validation Error',
              headers: {
                'x-api-version': { $ref: '#/components/headers/ApiVersionHeader' },
              },
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
            '401': {
              description: 'Unauthorized',
              headers: {
                'x-api-version': { $ref: '#/components/headers/ApiVersionHeader' },
              },
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
                  required: ['updates'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Inventory synced successfully',
              headers: {
                'x-api-version': { $ref: '#/components/headers/ApiVersionHeader' },
              },
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } },
              },
            },
            '400': {
              description: 'Validation Error',
              headers: {
                'x-api-version': { $ref: '#/components/headers/ApiVersionHeader' },
              },
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
            '401': {
              description: 'Unauthorized - Invalid API Key',
              headers: {
                'x-api-version': { $ref: '#/components/headers/ApiVersionHeader' },
              },
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
