#!/bin/bash

# effyDOC Platform - Log Monitoring Helper Script
# Usage: ./check-logs.sh [service] [lines]

SERVICE=${1:-"all"}
LINES=${2:-"20"}

echo "🔍 effyDOC Platform Log Checker"
echo "=================================="

case $SERVICE in
    "backend"|"api")
        echo "📡 Backend Error Logs (Last $LINES lines):"
        echo "----------------------------------------"
        tail -n $LINES /var/log/supervisor/backend.err.log
        echo ""
        echo "📋 Backend Output Logs (Last $LINES lines):"
        echo "-------------------------------------------"
        tail -n $LINES /var/log/supervisor/backend.out.log
        ;;
    
    "frontend"|"react")
        echo "🌐 Frontend Error Logs (Last $LINES lines):"
        echo "--------------------------------------------"
        tail -n $LINES /var/log/supervisor/frontend.err.log
        echo ""
        echo "📋 Frontend Output Logs (Last $LINES lines):"
        echo "---------------------------------------------"
        tail -n $LINES /var/log/supervisor/frontend.out.log
        ;;
    
    "database"|"mongo"|"db")
        echo "🗄️ MongoDB Error Logs (Last $LINES lines):"
        echo "--------------------------------------------"
        tail -n $LINES /var/log/mongodb.err.log
        echo ""
        echo "📋 MongoDB Output Logs (Last $LINES lines):"
        echo "---------------------------------------------"
        tail -n $LINES /var/log/mongodb.out.log
        ;;
    
    "supervisor"|"system")
        echo "⚙️ Supervisor System Logs (Last $LINES lines):"
        echo "------------------------------------------------"
        tail -n $LINES /var/log/supervisor/supervisord.log
        ;;
    
    "errors")
        echo "🚨 All Error Logs Summary:"
        echo "--------------------------"
        echo ""
        echo "Backend Errors:"
        tail -n 10 /var/log/supervisor/backend.err.log | grep -i "error\|exception\|failed" || echo "No recent backend errors"
        echo ""
        echo "Frontend Errors:"
        tail -n 10 /var/log/supervisor/frontend.err.log | grep -i "error\|warning\|failed" || echo "No recent frontend errors"
        echo ""
        echo "Database Errors:"
        tail -n 10 /var/log/mongodb.err.log | grep -i "error\|exception\|failed" || echo "No recent database errors"
        ;;
    
    "status")
        echo "📊 Service Status:"
        echo "------------------"
        sudo supervisorctl status
        echo ""
        echo "💾 Log File Sizes:"
        echo "------------------"
        ls -lh /var/log/supervisor/*.log | awk '{print $9, $5}'
        ;;
    
    "all"|*)
        echo "📊 Service Status:"
        echo "------------------"
        sudo supervisorctl status
        echo ""
        echo "🚨 Recent Errors (Last 5 lines each):"
        echo "--------------------------------------"
        echo ""
        echo "Backend:"
        tail -n 5 /var/log/supervisor/backend.err.log | tail -5
        echo ""
        echo "Frontend:"
        tail -n 5 /var/log/supervisor/frontend.err.log | tail -5
        echo ""
        echo "💾 Log File Information:"
        echo "------------------------"
        ls -lh /var/log/supervisor/*.log /var/log/mongodb.*.log | awk '{print $9, $5, $6, $7, $8}'
        ;;
esac

echo ""
echo "💡 Usage Examples:"
echo "  ./check-logs.sh backend 50    # Backend logs, last 50 lines"
echo "  ./check-logs.sh frontend      # Frontend logs, default 20 lines"
echo "  ./check-logs.sh errors        # Summary of all errors"
echo "  ./check-logs.sh status        # Service status and log sizes"
echo ""
echo "🔄 Real-time Monitoring:"
echo "  tail -f /var/log/supervisor/backend.err.log"
echo "  tail -f /var/log/supervisor/frontend.err.log"
echo "  sudo supervisorctl tail -f backend stderr"