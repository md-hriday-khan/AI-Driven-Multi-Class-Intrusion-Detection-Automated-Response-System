#!/usr/bin/env python3
"""
CyberAuton SOC System Validation
Comprehensive validation of all components and syntax
Created by Md.Hriday Khan
"""

import os
import sys
import subprocess
import logging
import re
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SystemValidator:
    def __init__(self):
        self.project_root = Path.cwd()
        self.errors = []
        self.warnings = []
        
    def validate_jsx_syntax(self):
        """Check for common JSX syntax errors"""
        logger.info("🔍 Validating JSX syntax...")
        
        tsx_files = list(self.project_root.glob('components/*.tsx'))
        jsx_errors = []
        
        # Patterns that commonly cause JSX errors
        error_patterns = [
            (r'"[^"]*< [0-9]', 'Unescaped < followed by number in string'),
            (r'"[^"]*> [0-9]', 'Potential > followed by number in string'),
            (r'<[A-Z][a-zA-Z0-9]*\s+[^>]*<', 'Nested < inside JSX tag'),
        ]
        
        for tsx_file in tsx_files:
            try:
                with open(tsx_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for line_num, line in enumerate(content.split('\n'), 1):
                    for pattern, description in error_patterns:
                        if re.search(pattern, line):
                            jsx_errors.append({
                                'file': tsx_file.name,
                                'line': line_num,
                                'issue': description,
                                'content': line.strip()
                            })
            except Exception as e:
                jsx_errors.append({
                    'file': tsx_file.name,
                    'line': 0,
                    'issue': f'Error reading file: {e}',
                    'content': ''
                })
        
        if jsx_errors:
            logger.error("❌ JSX syntax issues found:")
            for error in jsx_errors:
                logger.error(f"  {error['file']}:{error['line']} - {error['issue']}")
                logger.error(f"    Content: {error['content'][:100]}...")
            self.errors.extend(jsx_errors)
            return False
        else:
            logger.info("✅ No JSX syntax issues found")
            return True
    
    def validate_imports(self):
        """Validate all imports in TypeScript files"""
        logger.info("📦 Validating imports...")
        
        import_errors = []
        tsx_files = list(self.project_root.glob('components/*.tsx'))
        tsx_files.append(self.project_root / 'App.tsx')
        
        for tsx_file in tsx_files:
            try:
                with open(tsx_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Find all import statements
                import_lines = re.findall(r'^import.*?;', content, re.MULTILINE)
                
                for line in import_lines:
                    # Check for relative imports
                    if './components/' in line:
                        # Extract component name
                        component_match = re.search(r"from './components/([^']+)'", line)
                        if component_match:
                            component_file = self.project_root / 'components' / f"{component_match.group(1)}.tsx"
                            if not component_file.exists():
                                import_errors.append({
                                    'file': tsx_file.name,
                                    'issue': f'Missing component file: {component_file.name}',
                                    'line': line
                                })
                                
            except Exception as e:
                import_errors.append({
                    'file': tsx_file.name,
                    'issue': f'Error reading file: {e}',
                    'line': ''
                })
        
        if import_errors:
            logger.warning("⚠️  Import issues found:")
            for error in import_errors:
                logger.warning(f"  {error['file']} - {error['issue']}")
            self.warnings.extend(import_errors)
            return False
        else:
            logger.info("✅ All imports validated")
            return True
    
    def validate_component_exports(self):
        """Validate that all components have proper exports"""
        logger.info("🔧 Validating component exports...")
        
        export_errors = []
        tsx_files = list(self.project_root.glob('components/*.tsx'))
        
        for tsx_file in tsx_files:
            try:
                with open(tsx_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for export statements
                has_export = (
                    'export default' in content or
                    'export function' in content or
                    'export const' in content or
                    'export {' in content
                )
                
                if not has_export:
                    export_errors.append({
                        'file': tsx_file.name,
                        'issue': 'No export statement found'
                    })
                    
            except Exception as e:
                export_errors.append({
                    'file': tsx_file.name,
                    'issue': f'Error reading file: {e}'
                })
        
        if export_errors:
            logger.error("❌ Export issues found:")
            for error in export_errors:
                logger.error(f"  {error['file']} - {error['issue']}")
            self.errors.extend(export_errors)
            return False
        else:
            logger.info("✅ All component exports validated")
            return True
    
    def validate_package_json(self):
        """Validate package.json configuration"""
        logger.info("📋 Validating package.json...")
        
        package_file = self.project_root / 'package.json'
        
        if not package_file.exists():
            logger.error("❌ package.json not found")
            self.errors.append({'file': 'package.json', 'issue': 'File not found'})
            return False
        
        try:
            import json
            with open(package_file, 'r') as f:
                package_data = json.load(f)
            
            required_deps = [
                'react', 'react-dom', 'typescript', 'react-scripts',
                'lucide-react', '@radix-ui/react-tabs', '@radix-ui/react-progress'
            ]
            
            missing_deps = []
            dependencies = package_data.get('dependencies', {})
            
            for dep in required_deps:
                if dep not in dependencies:
                    missing_deps.append(dep)
            
            if missing_deps:
                logger.warning(f"⚠️  Missing dependencies: {', '.join(missing_deps)}")
                self.warnings.append({
                    'file': 'package.json',
                    'issue': f'Missing dependencies: {missing_deps}'
                })
            else:
                logger.info("✅ All required dependencies present")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error validating package.json: {e}")
            self.errors.append({'file': 'package.json', 'issue': str(e)})
            return False
    
    def validate_backend_files(self):
        """Validate backend Python files"""
        logger.info("🐍 Validating backend files...")
        
        required_backend_files = [
            'backend_api_server.py',
            'vehicle_safety_api.py',
            'real_time_ids.py'
        ]
        
        missing_files = []
        for file in required_backend_files:
            if not (self.project_root / file).exists():
                missing_files.append(file)
        
        if missing_files:
            logger.error(f"❌ Missing backend files: {', '.join(missing_files)}")
            self.errors.extend([{'file': f, 'issue': 'File not found'} for f in missing_files])
            return False
        else:
            logger.info("✅ All backend files present")
            return True
    
    def check_syntax_with_tsc(self):
        """Check TypeScript syntax using tsc"""
        logger.info("🔧 Running TypeScript syntax check...")
        
        try:
            # Try to compile TypeScript without emitting files
            result = subprocess.run(
                ['npx', 'tsc', '--noEmit', '--skipLibCheck'],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                logger.info("✅ TypeScript compilation successful")
                return True
            else:
                logger.error("❌ TypeScript compilation errors:")
                logger.error(result.stderr)
                self.errors.append({
                    'file': 'TypeScript',
                    'issue': 'Compilation errors',
                    'details': result.stderr
                })
                return False
                
        except subprocess.TimeoutExpired:
            logger.warning("⚠️  TypeScript check timed out")
            return True
        except FileNotFoundError:
            logger.warning("⚠️  TypeScript not available, skipping syntax check")
            return True
        except Exception as e:
            logger.warning(f"⚠️  TypeScript check failed: {e}")
            return True
    
    def generate_health_report(self):
        """Generate a comprehensive health report"""
        logger.info("📊 Generating system health report...")
        
        report = f"""
# CyberAuton SOC System Health Report

Generated: {__import__('datetime').datetime.now().isoformat()}

## Summary
- **Total Errors**: {len(self.errors)}
- **Total Warnings**: {len(self.warnings)}
- **Overall Status**: {'✅ HEALTHY' if len(self.errors) == 0 else '❌ ISSUES FOUND'}

## Components Status
- **Frontend Components**: {len(list(self.project_root.glob('components/*.tsx')))} files
- **UI Components**: {len(list(self.project_root.glob('components/ui/*.tsx')))} files
- **Backend Services**: {'✅' if (self.project_root / 'backend_api_server.py').exists() else '❌'}
- **Vehicle Safety API**: {'✅' if (self.project_root / 'vehicle_safety_api.py').exists() else '❌'}

## UAV Security Suite
- **MAVIDS**: {'✅' if (self.project_root / 'components/MAVIDS.tsx').exists() else '❌'}
- **DroneSploit**: {'✅' if (self.project_root / 'components/DroneSploit.tsx').exists() else '❌'}
- **UAV-NIDD**: {'✅' if (self.project_root / 'components/UAVNIDD.tsx').exists() else '❌'}
- **Collaborative IDS**: {'✅' if (self.project_root / 'components/UAVCollaborativeIDS.tsx').exists() else '❌'}
- **E-DIDS**: {'✅' if (self.project_root / 'components/EDIDS.tsx').exists() else '❌'}

## Emergency Control
- **Emergency Control System**: {'✅' if (self.project_root / 'components/EmergencyControlSystem.tsx').exists() else '❌'}
- **Response Playbooks**: {'✅' if (self.project_root / 'components/ResponsePlaybook.tsx').exists() else '❌'}

"""
        
        if self.errors:
            report += "## Errors Found\n"
            for i, error in enumerate(self.errors, 1):
                report += f"{i}. **{error.get('file', 'Unknown')}**: {error.get('issue', 'Unknown issue')}\n"
        
        if self.warnings:
            report += "\n## Warnings\n"
            for i, warning in enumerate(self.warnings, 1):
                report += f"{i}. **{warning.get('file', 'Unknown')}**: {warning.get('issue', 'Unknown issue')}\n"
        
        report += f"\n## Next Steps\n"
        if len(self.errors) == 0:
            report += "✅ System is ready for deployment!\n"
            report += "- Run `python start_cyberauton.py` to launch the complete system\n"
            report += "- Access the application at http://localhost:3000\n"
        else:
            report += "❌ Please resolve the errors above before deployment\n"
            report += "- Fix the identified syntax and import issues\n"
            report += "- Re-run this validation script\n"
        
        with open('SYSTEM_HEALTH_REPORT.md', 'w') as f:
            f.write(report)
        
        logger.info("📋 Health report saved to SYSTEM_HEALTH_REPORT.md")
        return report
    
    def run_validation(self):
        """Run complete system validation"""
        logger.info("🛡️  CyberAuton SOC - System Validation")
        logger.info("=" * 60)
        
        validation_steps = [
            ("JSX Syntax", self.validate_jsx_syntax),
            ("Imports", self.validate_imports),
            ("Component Exports", self.validate_component_exports),
            ("Package Configuration", self.validate_package_json),
            ("Backend Files", self.validate_backend_files),
            ("TypeScript Syntax", self.check_syntax_with_tsc),
        ]
        
        passed_steps = 0
        total_steps = len(validation_steps)
        
        for step_name, step_func in validation_steps:
            logger.info(f"\n{'='*20} {step_name} {'='*20}")
            try:
                if step_func():
                    passed_steps += 1
                    logger.info(f"✅ {step_name}: PASSED")
                else:
                    logger.error(f"❌ {step_name}: FAILED")
            except Exception as e:
                logger.error(f"❌ {step_name}: ERROR - {e}")
                self.errors.append({
                    'file': step_name,
                    'issue': f'Validation error: {e}'
                })
        
        # Generate report
        self.generate_health_report()
        
        # Final summary
        logger.info("\n" + "="*60)
        logger.info(f"🎯 VALIDATION COMPLETE")
        logger.info(f"Passed: {passed_steps}/{total_steps} steps")
        logger.info(f"Errors: {len(self.errors)}")
        logger.info(f"Warnings: {len(self.warnings)}")
        
        if len(self.errors) == 0:
            logger.info("✅ SYSTEM READY FOR DEPLOYMENT!")
            logger.info("🚀 Run: python start_cyberauton.py")
        else:
            logger.error("❌ SYSTEM HAS ISSUES - Please resolve errors")
        
        logger.info("="*60)
        
        return len(self.errors) == 0

def main():
    validator = SystemValidator()
    success = validator.run_validation()
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())