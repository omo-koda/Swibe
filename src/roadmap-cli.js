#!/usr/bin/env node

/**
 * Swibe Language Roadmap CLI
 * Track progress on all 28 integrations
 */

import fs from 'fs';

const ROADMAP_FILE = '.roadmap.json';

class RoadmapCLI {
  constructor() {
    this.roadmap = this.loadRoadmap();
  }

  loadRoadmap() {
    try {
      const data = fs.readFileSync(ROADMAP_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error loading roadmap:', err.message);
      process.exit(1);
    }
  }

  saveRoadmap() {
    fs.writeFileSync(ROADMAP_FILE, JSON.stringify(this.roadmap, null, 2));
  }

  status(phaseFilter = null) {
    console.log('\n📊 Swibe Language Integration Roadmap\n');
    console.log(`Last Updated: ${this.roadmap.lastUpdated}\n`);

    const phases = Object.entries(this.roadmap.phases);

    for (const [phaseKey, phase] of phases) {
      if (phaseFilter && !phaseKey.includes(phaseFilter)) continue;

      const completed = phase.features.filter(f => f.status === 'complete').length;
      const total = phase.features.length;
      const percent = Math.round((completed / total) * 100);

      console.log(`\n${this.getPhaseEmoji(phaseKey)} ${phase.name} (${phaseKey})`);
      console.log(`Duration: ${phase.duration}`);
      console.log(`Progress: ${completed}/${total} (${percent}%)`);
      console.log(this.progressBar(percent));

      phase.features.forEach(feature => {
        const icon = this.getStatusIcon(feature.status);
        console.log(
          `  ${icon} #${feature.id}: ${feature.name} (${feature.priority || 'N/A'})`
        );
      });
    }

    console.log('\n' + this.overallStats());
  }

  listTodos(priority = null) {
    console.log('\n⏳ TODO Items\n');

    const todos = [];
    Object.values(this.roadmap.phases).forEach(phase => {
      phase.features.forEach(feature => {
        if (feature.status === 'todo') {
          if (!priority || feature.priority === priority) {
            todos.push({
              ...feature,
              phase: phase.name
            });
          }
        }
      });
    });

    todos.sort((a, b) => {
      const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    });

    if (todos.length === 0) {
      console.log('No TODO items!');
      return;
    }

    todos.forEach(item => {
      console.log(
        `${this.getStatusIcon('todo')} #${item.id}: ${item.name}`
      );
      console.log(
        `   Phase: ${item.phase} | Week: ${item.estimatedWeek || 'TBD'} | Priority: ${item.priority}`
      );
      if (item.tasks && item.tasks.length > 0) {
        console.log(`   Tasks: ${item.tasks.length}`);
      }
      console.log('');
    });

    console.log(`Total TODO items: ${todos.length}`);
  }

  update(featureId, status, completion = null) {
    let found = false;

    for (const phase of Object.values(this.roadmap.phases)) {
      const feature = phase.features.find(f => f.id === parseInt(featureId));
      if (feature) {
        const oldStatus = feature.status;
        const oldCompletion = feature.completion;

        feature.status = status;
        if (completion !== null) {
          feature.completion = completion;
        }

        if (status === 'complete' && !feature.completedDate) {
          feature.completedDate = new Date().toISOString().split('T')[0];
        }

        this.saveRoadmap();

        console.log(`\n✅ Updated Feature #${featureId}`);
        console.log(`   Status: ${oldStatus} → ${status}`);
        if (completion !== null) {
          console.log(`   Completion: ${oldCompletion}% → ${completion}%`);
        }

        this.updateStats();
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`❌ Feature #${featureId} not found`);
      process.exit(1);
    }
  }

  updateStats() {
    let completed = 0;
    let inProgress = 0;
    let todo = 0;
    let blocked = 0;

    Object.values(this.roadmap.phases).forEach(phase => {
      phase.features.forEach(feature => {
        if (feature.status === 'complete') completed++;
        else if (feature.status === 'in-progress') inProgress++;
        else if (feature.status === 'todo') todo++;
        else if (feature.status === 'blocked') blocked++;
      });
    });

    const total = completed + inProgress + todo + blocked;

    this.roadmap.statistics = {
      totalFeatures: total,
      completed,
      inProgress,
      todo,
      blocked,
      completionPercentage: Math.round((completed / total) * 100),
      highPriorityItems: 10,
      mediumPriorityItems: 14,
      lowPriorityItems: 4
    };

    this.roadmap.lastUpdated = new Date().toISOString().split('T')[0];
    this.saveRoadmap();
  }

  show(featureId) {
    for (const [_phaseKey, phase] of Object.entries(this.roadmap.phases)) {
      const feature = phase.features.find(f => f.id === parseInt(featureId));
      if (feature) {
        console.log(`\n📋 Feature #${feature.id}: ${feature.name}\n`);
        console.log(`Phase: ${phase.name}`);
        console.log(`Status: ${this.getStatusIcon(feature.status)} ${feature.status}`);
        console.log(`Completion: ${feature.completion}%`);
        console.log(`Priority: ${feature.priority}`);

        if (feature.estimatedWeek) {
          console.log(`Estimated: Week ${feature.estimatedWeek}`);
        }

        if (feature.dependencies && feature.dependencies.length > 0) {
          console.log(`Dependencies: #${feature.dependencies.join(', #')}`);
        }

        if (feature.tasks && feature.tasks.length > 0) {
          console.log(`\nTasks:`);
          feature.tasks.forEach((task, i) => {
            console.log(`  ${i + 1}. ${task}`);
          });
        }

        if (feature.files && feature.files.length > 0) {
          console.log(`\nFiles:`);
          feature.files.forEach(file => {
            console.log(`  - ${file}`);
          });
        }

        return;
      }
    }

    console.log(`❌ Feature #${featureId} not found`);
    process.exit(1);
  }

  overallStats() {
    const stats = this.roadmap.statistics;
    return `
📈 Overall Progress: ${stats.completionPercentage}%
   Completed: ${stats.completed}/${stats.totalFeatures}
   In Progress: ${stats.inProgress}
   TODO: ${stats.todo}
   Blocked: ${stats.blocked}

Priority Distribution:
   🔴 High: ${stats.highPriorityItems}
   🟡 Medium: ${stats.mediumPriorityItems}
   🟢 Low: ${stats.lowPriorityItems}
`;
  }

  progressBar(percent) {
    const filled = Math.round(percent / 5);
    const empty = 20 - filled;
    return `   [${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}%`;
  }

  getStatusIcon(status) {
    const icons = {
      'complete': '✅',
      'in-progress': '⏳',
      'todo': '⬜',
      'blocked': '🔴'
    };
    return icons[status] || '❓';
  }

  getPhaseEmoji(phase) {
    const emojis = {
      'phase1': '🎯',
      'phase2': '🔧',
      'phase3': '⚡',
      'phase4': '🚀'
    };
    return emojis[phase] || '📦';
  }

  getPriorityColor(priority) {
    const colors = {
      'HIGH': '\x1b[31m',
      'MEDIUM': '\x1b[33m',
      'LOW': '\x1b[32m'
    };
    return colors[priority] || '';
  }

  help() {
    console.log(`
Swibe Language Roadmap CLI

Usage: swibe roadmap [command] [options]

Commands:
  status [phase]         Show roadmap status
  list-todos [priority]  List all TODO items
  show <id>              Show feature details
  update <id> <status>   Update feature status
  help                   Show this help message

Examples:
  swibe roadmap status               # Full status
  swibe roadmap status phase1         # Phase 1 only
  swibe roadmap list-todos            # All TODOs
  swibe roadmap list-todos HIGH       # High priority TODOs
  swibe roadmap show 3                # Details for feature #3
  swibe roadmap update 3 in-progress  # Mark as in progress
  swibe roadmap update 3 complete     # Mark as complete

Statuses: complete, in-progress, todo, blocked
    `);
  }
}

// CLI Entry Point
const args = process.argv.slice(2);

if (args.length === 0) {
  const cli = new RoadmapCLI();
  cli.status();
  process.exit(0);
}

const cli = new RoadmapCLI();
const command = args[0];

switch (command) {
  case 'status':
    cli.status(args[1]);
    break;
  case 'list-todos':
  case 'todos':
    cli.listTodos(args[1]);
    break;
  case 'show':
    if (!args[1]) {
      console.log('Error: feature ID required');
      process.exit(1);
    }
    cli.show(args[1]);
    break;
  case 'update':
    if (!args[1] || !args[2]) {
      console.log('Error: feature ID and status required');
      process.exit(1);
    }
    cli.update(args[1], args[2], args[3]);
    cli.status();
    break;
  case 'help':
  case '-h':
  case '--help':
    cli.help();
    break;
  default:
    console.log(`Unknown command: ${command}`);
    cli.help();
    process.exit(1);
}
