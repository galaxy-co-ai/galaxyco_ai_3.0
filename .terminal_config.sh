#!/bin/bash
# ========================================
# GalaxyCo AI 3.0 Terminal Configuration
# Optimized for Next.js Development
# ========================================

# -------------------- COLORS --------------------
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export PURPLE='\033[0;35m'
export CYAN='\033[0;36m'
export WHITE='\033[1;37m'
export NC='\033[0m' # No Color

# -------------------- NEXT.JS ALIASES --------------------
alias dev='npm run dev'
alias build='npm run build'
alias start='npm run start'
alias lint='npm run lint'
alias typecheck='npm run typecheck'
alias test='npm run test'
alias testui='npm run test:ui'
alias coverage='npm run test:coverage'

# Database shortcuts
alias dbpush='npm run db:push'
alias dbstudio='npm run db:studio'
alias dbseed='npm run db:seed'

# Environment check
alias envcheck='npm run env:check'

# Quick dev server with automatic browser opening
alias devo='npm run dev & sleep 3 && start http://localhost:3000'

# Build and start production mode
alias prod='npm run build && npm run start'

# Clean build (removes .next and rebuilds)
alias cleanb='rm -rf .next && npm run build'

# -------------------- GIT ALIASES --------------------
alias gs='git status'
alias ga='git add'
alias gaa='git add .'
alias gc='git commit -m'
alias gp='git push'
alias gpu='git push -u origin $(git branch --show-current)'
alias gpl='git pull'
alias gco='git checkout'
alias gb='git branch'
alias glog='git log --oneline --graph --decorate -10'
alias gdiff='git diff'
alias gstash='git stash'
alias gpop='git stash pop'

# Git with conventional commits
alias gfeat='git commit -m "feat:"'
alias gfix='git commit -m "fix:"'
alias gdocs='git commit -m "docs:"'
alias gstyle='git commit -m "style:"'
alias grefactor='git commit -m "refactor:"'
alias gtest='git commit -m "test:"'
alias gchore='git commit -m "chore:"'

# -------------------- PROJECT NAVIGATION --------------------
alias proj='cd /c/Users/Owner/workspace/galaxyco-ai-3.0'
alias src='cd /c/Users/Owner/workspace/galaxyco-ai-3.0/src'
alias comp='cd /c/Users/Owner/workspace/galaxyco-ai-3.0/src/components'
alias api='cd /c/Users/Owner/workspace/galaxyco-ai-3.0/src/app/api'
alias docs='cd /c/Users/Owner/workspace/galaxyco-ai-3.0/docs'
alias pub='cd /c/Users/Owner/workspace/galaxyco-ai-3.0/public'
alias tests='cd /c/Users/Owner/workspace/galaxyco-ai-3.0/tests'

# -------------------- NPM/PACKAGE MANAGEMENT --------------------
alias ni='npm install'
alias nid='npm install --save-dev'
alias nu='npm update'
alias nrm='npm uninstall'
alias nls='npm list --depth=0'
alias outdated='npm outdated'

# -------------------- DEVELOPMENT HELPERS --------------------
# Quick environment variable check (with security)
alias envcheck-safe='echo -e "${CYAN}Environment Variables:${NC}" && env | grep -E "NEXT_PUBLIC_|DATABASE_|CLERK_|OPENAI_|ANTHROPIC_|UPSTASH_|TWILIO_|GAMMA_" | sed "s/=.*/=***HIDDEN***/"'

# Show port usage
alias ports='netstat -an | grep LISTEN | grep -E "3000|3001|5432|6379|8000"'

# Kill process on port (usage: killport 3000)
killport() {
    local port=$1
    if [ -z "$port" ]; then
        echo "Usage: killport <port_number>"
        return 1
    fi
    
    local pid=$(netstat -ano | grep ":$port" | grep LISTENING | awk '{print $5}' | head -1)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        taskkill //PID $pid //F 2>/dev/null
    else
        echo -e "${GREEN}No process found on port $port${NC}"
    fi
}

# -------------------- PROJECT HEALTH CHECK --------------------
health() {
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     GalaxyCo AI 3.0 Health Check       ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    
    # Environment check
    echo -e "\n${YELLOW}Environment Setup:${NC}"
    if [ -f .env.local ]; then
        echo -e "${GREEN}✓ .env.local exists${NC}"
        local var_count=$(grep -c "=" .env.local 2>/dev/null || echo "0")
        echo "  Variables configured: $var_count"
    else
        echo -e "${RED}✗ .env.local not found${NC}"
    fi
    
    # Node/NPM version
    echo -e "\n${YELLOW}Runtime Versions:${NC}"
    echo -e "  Node: ${GREEN}$(node -v)${NC}"
    echo -e "  NPM:  ${GREEN}$(npm -v)${NC}"
    
    # TypeScript check
    echo -e "\n${YELLOW}TypeScript Check:${NC}"
    npx tsc --noEmit 2>/dev/null && echo -e "${GREEN}✓ No TypeScript errors${NC}" || echo -e "${RED}✗ TypeScript errors found${NC}"
    
    # ESLint check (quick)
    echo -e "\n${YELLOW}ESLint Check:${NC}"
    npm run lint 2>/dev/null >/dev/null && echo -e "${GREEN}✓ No linting errors${NC}" || echo -e "${RED}✗ Linting errors found (run 'npm run lint' for details)${NC}"
    
    # Check for outdated packages (top 5)
    echo -e "\n${YELLOW}Package Updates:${NC}"
    local outdated_count=$(npm outdated 2>/dev/null | wc -l)
    if [ "$outdated_count" -le 1 ]; then
        echo -e "${GREEN}✓ All packages up to date${NC}"
    else
        echo -e "${YELLOW}$((outdated_count - 1)) packages have updates available${NC}"
        echo "  Run 'npm outdated' to see details"
    fi
    
    # Git status
    echo -e "\n${YELLOW}Git Status:${NC}"
    if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
        echo -e "${GREEN}✓ Working directory clean${NC}"
    else
        echo -e "${YELLOW}Modified files:${NC}"
        git status -s | head -5
        local total=$(git status -s | wc -l)
        if [ "$total" -gt 5 ]; then
            echo "  ... and $((total - 5)) more"
        fi
    fi
    
    echo -e "\n${CYAN}Run 'npm run env:check' for full environment validation${NC}"
}

# -------------------- PRODUCTIVITY FUNCTIONS --------------------
# Quick commit with message
qcommit() {
    if [ -z "$1" ]; then
        echo "Usage: qcommit 'your commit message'"
        return 1
    fi
    git add . && git commit -m "$1" && git push
}

# Create new component boilerplate
newcomp() {
    if [ -z "$1" ]; then
        echo "Usage: newcomp ComponentName [category]"
        echo "Categories: finance-hq, crm, conversations, knowledge, marketing, shared"
        return 1
    fi
    
    local name=$1
    local category=${2:-shared}
    local dir="src/components/$category/$name"
    
    mkdir -p "$dir"
    
    cat > "$dir/$name.tsx" << EOF
'use client'

import { FC } from 'react'

interface ${name}Props {
  // Add your props here
}

/**
 * $name Component
 * 
 * @description Add component description here
 */
export const $name: FC<${name}Props> = ({}) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold">$name</h2>
      {/* Add your component content here */}
    </div>
  )
}
EOF
    
    cat > "$dir/index.ts" << EOF
export { $name } from './$name'
EOF
    
    echo -e "${GREEN}✓ Component $name created at $dir${NC}"
    echo -e "${YELLOW}Don't forget to add it to the category's index.ts if needed${NC}"
}

# -------------------- TERMINAL ENHANCEMENTS --------------------
# Better ls with colors
alias ls='ls --color=auto'
alias ll='ls -lah --color=auto'
alias la='ls -A --color=auto'
alias l='ls -CF --color=auto'

# Directory navigation
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'

# Clear screen
alias c='clear'
alias cls='clear'

# -------------------- PROJECT INFO --------------------
projinfo() {
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║         GalaxyCo AI Platform 3.0        ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo -e "${YELLOW}Project:${NC} $(grep '"name"' package.json | cut -d'"' -f4 2>/dev/null || echo 'Unknown')"
    echo -e "${YELLOW}Version:${NC} $(grep '"version"' package.json | cut -d'"' -f4 2>/dev/null || echo 'Unknown')"
    echo -e "${YELLOW}Node:${NC} $(node -v)"
    echo -e "${YELLOW}NPM:${NC} $(npm -v)"
    echo -e "${YELLOW}Branch:${NC} $(git branch --show-current 2>/dev/null || echo 'not a git repo')"
    echo -e "${YELLOW}Last Commit:${NC} $(git log -1 --oneline 2>/dev/null || echo 'no commits')"
    echo ""
    echo -e "${PURPLE}Type 'commands' for quick reference${NC}"
    echo -e "${PURPLE}Type 'health' for project status${NC}"
}

# -------------------- QUICK START GUIDE --------------------
commands() {
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║        Quick Command Reference          ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📦 Development:${NC}"
    echo -e "  ${GREEN}dev${NC}         - Start dev server"
    echo -e "  ${GREEN}build${NC}       - Build for production"
    echo -e "  ${GREEN}test${NC}        - Run tests"
    echo -e "  ${GREEN}health${NC}      - Run project health check"
    echo -e "  ${GREEN}typecheck${NC}   - Check TypeScript"
    echo -e "  ${GREEN}envcheck${NC}    - Validate all API keys"
    echo ""
    echo -e "${YELLOW}🗄️  Database:${NC}"
    echo -e "  ${GREEN}dbpush${NC}      - Push schema to database"
    echo -e "  ${GREEN}dbstudio${NC}    - Open Drizzle Studio"
    echo -e "  ${GREEN}dbseed${NC}      - Seed database"
    echo ""
    echo -e "${YELLOW}🚀 Git:${NC}"
    echo -e "  ${GREEN}gs${NC}          - Git status"
    echo -e "  ${GREEN}qcommit${NC}     - Quick add, commit, push"
    echo -e "  ${GREEN}glog${NC}        - View git history"
    echo -e "  ${GREEN}gfeat/gfix${NC}  - Conventional commits"
    echo ""
    echo -e "${YELLOW}📁 Navigation:${NC}"
    echo -e "  ${GREEN}proj${NC}        - Go to project root"
    echo -e "  ${GREEN}src${NC}         - Go to src directory"
    echo -e "  ${GREEN}comp${NC}        - Go to components"
    echo -e "  ${GREEN}api${NC}         - Go to API routes"
    echo ""
    echo -e "${YELLOW}🛠️  Utilities:${NC}"
    echo -e "  ${GREEN}killport${NC}    - Kill process on port"
    echo -e "  ${GREEN}newcomp${NC}     - Create new component"
    echo -e "  ${GREEN}projinfo${NC}    - Show project info"
    echo -e "  ${GREEN}ports${NC}       - Show active ports"
    echo ""
    echo -e "${PURPLE}Type 'commands' to see this again${NC}"
}

# Show welcome message when terminal starts (only once per session)
if [ -z "$GALAXYCO_TERMINAL_LOADED" ]; then
    export GALAXYCO_TERMINAL_LOADED=1
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   Welcome to GalaxyCo Development! 🚀   ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo -e "${YELLOW}Terminal optimized for Next.js development${NC}"
    echo -e "Type ${GREEN}commands${NC} for quick reference"
    echo -e "Type ${GREEN}health${NC} to check project status"
    echo ""
fi
