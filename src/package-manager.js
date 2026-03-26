/**
 * Package Manager
 * Manages Swibe packages, dependencies, and versioning
 */

import fs from "node:fs";
import path from "node:path";

class PackageManager {
  constructor(registryUrl = 'https://registry.swibe.dev') {
    this.registryUrl = registryUrl;
    this.cache = new Map();
    this.packages = new Map();
  }

  /**
   * Load package manifest (swibe.toml)
   */
  loadManifest(manifestPath) {
    const content = fs.readFileSync(manifestPath, 'utf8');
    return this.parseToml(content);
  }

  /**
   * Parse TOML manifest
   */
  parseToml(content) {
    const manifest = {
      name: '',
      version: '0.1.0',
      description: '',
      dependencies: {},
      devDependencies: {}
    };

    const lines = content.split('\n');
    let section = null;

    for (const line of lines) {
      if (line.startsWith('[')) {
        section = line.slice(1, -1);
        continue;
      }

      const [key, value] = line.split('=').map(s => s.trim());
      if (!key) continue;

      if (section === 'package') {
        manifest[key] = value.replace(/"/g, '');
      } else if (section === 'dependencies') {
        manifest.dependencies[key] = value.replace(/"/g, '');
      } else if (section === 'dev-dependencies') {
        manifest.devDependencies[key] = value.replace(/"/g, '');
      }
    }

    return manifest;
  }

  /**
   * Resolve dependencies
   */
  async resolveDependencies(manifest) {
    const resolved = new Map();
    const queue = Object.entries(manifest.dependencies || {});

    while (queue.length > 0) {
      const [name, version] = queue.shift();

      if (resolved.has(name)) continue;

      try {
        const pkg = await this.fetchPackage(name, version);
        resolved.set(name, pkg);

        // Add transitive dependencies
        Object.entries(pkg.dependencies || {}).forEach(([depName, depVersion]) => {
          if (!resolved.has(depName)) {
            queue.push([depName, depVersion]);
          }
        });
      } catch (err) {
        console.error(`Failed to fetch ${name}@${version}: ${err.message}`);
      }
    }

    return resolved;
  }

  /**
   * Fetch package from registry
   */
  async fetchPackage(name, version) {
    const cacheKey = `${name}@${version}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const _url = `${this.registryUrl}/${name}/${version}`;

    try {
      // Simulate fetch (in real app would use fetch API)
      const pkg = {
        name,
        version,
        description: `Package: ${name}`,
        dependencies: {}
      };

      this.cache.set(cacheKey, pkg);
      return pkg;
    } catch (err) {
      throw new Error(`Cannot fetch ${name}@${version}`);
    }
  }

  /**
   * Install dependencies
   */
  async install(manifestPath) {
    const manifest = this.loadManifest(manifestPath);
    const resolved = await this.resolveDependencies(manifest);

    const lockfile = {
      version: 1,
      packages: Array.from(resolved.entries()).map(([name, pkg]) => ({
        name,
        version: pkg.version,
        dependencies: pkg.dependencies
      }))
    };

    // Write lock file
    const lockPath = path.join(path.dirname(manifestPath), 'swibe.lock');
    fs.writeFileSync(lockPath, JSON.stringify(lockfile, null, 2));

    return lockfile;
  }

  /**
   * Publish package to registry
   */
  async publish(manifestPath, _token) {
    const manifest = this.loadManifest(manifestPath);
    const _url = `${this.registryUrl}/${manifest.name}/${manifest.version}/publish`;

    // Validate manifest
    if (!manifest.name || !manifest.version) {
      throw new Error('Name and version required');
    }

    // In real implementation, would upload to registry
    return {
      success: true,
      url: `${this.registryUrl}/${manifest.name}/${manifest.version}`
    };
  }

  /**
   * Generate default manifest
   */
  generateManifest(name, version = '0.1.0') {
    return `[package]
name = "${name}"
version = "${version}"
description = "Swibe package"
authors = ["Your Name"]

[dependencies]

[dev-dependencies]
`;
  }

  /**
   * Check semantic versioning
   */
  satisfiesVersion(version, constraint) {
    // Simple version matching
    if (constraint === '*' || constraint === 'latest') return true;
    if (constraint === version) return true;

    // Range matching (^, ~, >=, etc.)
    if (constraint.startsWith('^')) {
      return this.sameMajor(version, constraint.slice(1));
    }
    if (constraint.startsWith('~')) {
      return this.sameMinor(version, constraint.slice(1));
    }

    return false;
  }

  /**
   * Check same major version
   */
  sameMajor(v1, v2) {
    const [major1] = v1.split('.');
    const [major2] = v2.split('.');
    return major1 === major2;
  }

  /**
   * Check same minor version
   */
  sameMinor(v1, v2) {
    const [major1, minor1] = v1.split('.');
    const [major2, minor2] = v2.split('.');
    return major1 === major2 && minor1 === minor2;
  }

  /**
   * Get installed packages
   */
  getInstalledPackages(lockPath) {
    const content = fs.readFileSync(lockPath, 'utf8');
    const lock = JSON.parse(content);
    return lock.packages;
  }
}

export { PackageManager };
