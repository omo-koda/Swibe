/**
 * REST/GraphQL API Generator
 * Auto-generates API endpoints from #[api] macros
 */

class APIGenerator {
  constructor() {
    this.endpoints = [];
  }

  /**
   * Extract API definitions from code
   */
  extract(code) {
    const apiRegex = /#\[api\(([^)]*)\)\]\s*fn\s+(\w+)\s*\(([^)]*)\)\s*->\s*(\w+)\s*{([^}]*)}/gs;
    let match;

    while ((match = apiRegex.exec(code)) !== null) {
      const config = this.parseConfig(match[1]);
      const fn = match[2];
      const params = match[3];
      const returns = match[4];

      this.endpoints.push({
        name: fn,
        method: config.method || 'GET',
        path: config.path || `/${fn}`,
        params: this.parseParams(params),
        returns,
        description: config.description || ''
      });
    }

    return this.endpoints;
  }

  /**
   * Parse API macro config
   */
  parseConfig(configStr) {
    const config = {};
    const pairs = configStr.split(',');

    for (const pair of pairs) {
      const [key, value] = pair.split('=').map(s => s.trim());
      config[key] = value ? value.replace(/"/g, '') : true;
    }

    return config;
  }

  /**
   * Parse parameters
   */
  parseParams(paramStr) {
    const params = [];
    const parts = paramStr.split(',').map(s => s.trim());

    for (const part of parts) {
      const [name, type] = part.split(':').map(s => s.trim());
      if (name) {
        params.push({ name, type });
      }
    }

    return params;
  }

  /**
   * Generate Express.js handlers
   */
  generateExpress() {
    let code = `const express = require('express');
const router = express.Router();

`;

    for (const endpoint of this.endpoints) {
      const method = endpoint.method.toLowerCase();
      const paramList = endpoint.params.map(p => p.name).join(', ');

      code += `// ${endpoint.description || endpoint.name}
router.${method}('${endpoint.path}', (req, res) => {
  const { ${paramList} } = req.${method === 'get' ? 'query' : 'body'};
  // TODO: implement ${endpoint.name}
  res.json({ result: '${endpoint.name} not implemented' });
});

`;
    }

    code += `module.exports = router;`;
    return code;
  }

  /**
   * Generate GraphQL schema
   */
  generateGraphQL() {
    let schema = `type Query {
`;

    for (const endpoint of this.endpoints) {
      const args = endpoint.params
        .map(p => `${p.name}: ${this.toGraphQLType(p.type)}`)
        .join(', ');

      schema += `  ${endpoint.name}(${args}): ${endpoint.returns}\n`;
    }

    schema += `}

type Mutation {
`;

    for (const endpoint of this.endpoints) {
      if (endpoint.method !== 'GET') {
        const args = endpoint.params
          .map(p => `${p.name}: ${this.toGraphQLType(p.type)}`)
          .join(', ');

        schema += `  ${endpoint.name}(${args}): ${endpoint.returns}\n`;
      }
    }

    schema += `}`;
    return schema;
  }

  /**
   * Convert Vibe types to GraphQL types
   */
  toGraphQLType(type) {
    const mapping = {
      'str': 'String',
      'i32': 'Int',
      'i64': 'Long',
      'f32': 'Float',
      'f64': 'Float',
      'bool': 'Boolean'
    };

    if (type.startsWith('[')) {
      const inner = type.slice(1, -1);
      return `[${mapping[inner] || inner}]`;
    }

    return mapping[type] || type;
  }

  /**
   * Generate OpenAPI/Swagger spec
   */
  generateOpenAPI(title = 'API', version = '1.0.0') {
    const spec = {
      openapi: '3.0.0',
      info: { title, version },
      paths: {}
    };

    for (const endpoint of this.endpoints) {
      const path = endpoint.path;
      if (!spec.paths[path]) {
        spec.paths[path] = {};
      }

      const method = endpoint.method.toLowerCase();
      spec.paths[path][method] = {
        description: endpoint.description,
        parameters: endpoint.params.map(p => ({
          name: p.name,
          in: method === 'get' ? 'query' : 'body',
          schema: { type: this.toOpenAPIType(p.type) }
        })),
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { type: endpoint.returns }
              }
            }
          }
        }
      };
    }

    return spec;
  }

  /**
   * Convert to OpenAPI type
   */
  toOpenAPIType(type) {
    const mapping = {
      'str': 'string',
      'i32': 'integer',
      'i64': 'integer',
      'f32': 'number',
      'f64': 'number',
      'bool': 'boolean'
    };
    return mapping[type] || type;
  }

  /**
   * Generate Python FastAPI handlers
   */
  generateFastAPI() {
    let code = `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

`;

    for (const endpoint of this.endpoints) {
      const paramList = endpoint.params
        .map(p => `${p.name}: ${this.toPythonType(p.type)}`)
        .join(', ');

      code += `@app.${endpoint.method.lower()}("${endpoint.path}")
async def ${endpoint.name}(${paramList}):
    """${endpoint.description || endpoint.name}"""
    # TODO: implement
    return {"result": "${endpoint.name} not implemented"}

`;
    }

    return code;
  }

  /**
   * Convert to Python type
   */
  toPythonType(type) {
    const mapping = {
      'str': 'str',
      'i32': 'int',
      'i64': 'int',
      'f32': 'float',
      'f64': 'float',
      'bool': 'bool'
    };
    return mapping[type] || 'Any';
  }
}

export { APIGenerator };
