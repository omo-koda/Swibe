/**
 * Database Schema Generator
 * Generates SQL and ORM models from #[table] macros
 */

class DBGenerator {
  constructor() {
    this.tables = [];
  }

  /**
   * Extract table definitions from code
   */
  extract(code) {
    const tableRegex = /#\[table\(([^)]*)\)\]\s*fn\s+(\w+)\s*\(([^)]*)\)/gs;
    let match;

    while ((match = tableRegex.exec(code)) !== null) {
      const tableName = match[2];
      const fields = this.parseFields(match[3]);

      this.tables.push({
        name: tableName,
        fields
      });
    }

    return this.tables;
  }

  /**
   * Parse table fields
   */
  parseFields(fieldStr) {
    const fields = [];
    const parts = fieldStr.split(',');

    for (const part of parts) {
      const [name, type] = part.split(':').map(s => s.trim());
      if (name) {
        fields.push({
          name,
          type,
          nullable: type.includes('Option'),
          primary: name === 'id'
        });
      }
    }

    return fields;
  }

  /**
   * Generate SQL CREATE TABLE statements
   */
  generateSQL(dialect = 'postgresql') {
    let sql = '';

    for (const table of this.tables) {
      sql += `CREATE TABLE ${table.name} (\n`;

      const columns = table.fields.map(field => {
        const type = this.toSQLType(field.type, dialect);
        const constraints = [];

        if (field.primary) constraints.push('PRIMARY KEY');
        if (!field.nullable) constraints.push('NOT NULL');

        return `  ${field.name} ${type} ${constraints.join(' ')}`;
      });

      sql += columns.join(',\n');
      sql += '\n);\n\n';
    }

    return sql;
  }

  /**
   * Convert Vibe types to SQL types
   */
  toSQLType(type, dialect = 'postgresql') {
    const mapping = {
      'i32': { postgresql: 'INTEGER', mysql: 'INT', sqlite: 'INTEGER' },
      'i64': { postgresql: 'BIGINT', mysql: 'BIGINT', sqlite: 'INTEGER' },
      'f32': { postgresql: 'REAL', mysql: 'FLOAT', sqlite: 'REAL' },
      'f64': { postgresql: 'DOUBLE PRECISION', mysql: 'DOUBLE', sqlite: 'REAL' },
      'str': { postgresql: 'VARCHAR(255)', mysql: 'VARCHAR(255)', sqlite: 'TEXT' },
      'bool': { postgresql: 'BOOLEAN', mysql: 'TINYINT(1)', sqlite: 'INTEGER' }
    };

    const base = type.replace('Option', '').trim();
    return mapping[base]?.[dialect] || 'VARCHAR(255)';
  }

  /**
   * Generate Mongoose models
   */
  generateMongoose() {
    let code = `const mongoose = require('mongoose');

`;

    for (const table of this.tables) {
      const schema = `const ${table.name}Schema = new mongoose.Schema({
`;

      const fields = table.fields.map(field => {
        const type = this.toMongooseType(field.type);
        const config = { type };

        if (field.primary) config.primaryKey = true;
        if (!field.nullable) config.required = true;

        return `  ${field.name}: ${JSON.stringify(config)}`;
      }).join(',\n');

      code += schema + fields + '\n});\n\n';
      code += `export const ${table.name} = mongoose.model('${table.name}', ${table.name}Schema);\n\n`;
    }

    return code;
  }

  /**
   * Convert to Mongoose type
   */
  toMongooseType(type) {
    const mapping = {
      'i32': 'Number',
      'i64': 'Number',
      'f32': 'Number',
      'f64': 'Number',
      'str': 'String',
      'bool': 'Boolean'
    };

    const base = type.replace('Option', '').trim();
    return mapping[base] || 'String';
  }

  /**
   * Generate SQLAlchemy ORM models
   */
  generateSQLAlchemy() {
    let code = `from sqlalchemy import Column, String, Integer, Float, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

`;

    for (const table of this.tables) {
      code += `class ${this.capitalize(table.name)}(Base):
    __tablename__ = '${table.name}'

`;

      for (const field of table.fields) {
        const type = this.toSQLAlchemyType(field.type);
        const primary = field.primary ? ', primary_key=True' : '';
        const nullable = field.nullable ? ', nullable=True' : ', nullable=False';

        code += `    ${field.name} = Column(${type}${primary}${nullable})\n`;
      }

      code += '\n';
    }

    return code;
  }

  /**
   * Convert to SQLAlchemy type
   */
  toSQLAlchemyType(type) {
    const mapping = {
      'i32': 'Integer',
      'i64': 'Integer',
      'f32': 'Float',
      'f64': 'Float',
      'str': 'String',
      'bool': 'Boolean'
    };

    const base = type.replace('Option', '').trim();
    return mapping[base] || 'String';
  }

  /**
   * Generate migrations
   */
  generateMigration() {
    const timestamp = Date.now();
    let migration = `-- Migration: ${timestamp}
-- Auto-generated from Vibe schema

`;

    for (const table of this.tables) {
      migration += `-- Table: ${table.name}\n`;
      migration += this.generateSQL('postgresql');
    }

    return migration;
  }

  /**
   * Helper to capitalize
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export { DBGenerator };
