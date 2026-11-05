import re
import os

def refactor_app_tsx():
    path = "frontend/src/App.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace noisy/blurry background
    old_bg_pattern = re.compile(
        r'\{isSingleScreenRoute && \(\s*<div className="absolute inset-0 z-0 pointer-events-none">.*?</div>\s*\)\}',
        re.DOTALL
    )
    new_bg = '''{isSingleScreenRoute && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[#090D11]" />
        </div>
      )}'''
    content = old_bg_pattern.sub(new_bg, content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Refactored App.tsx")

def refactor_navbar_tsx():
    path = "frontend/src/components/Navbar.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace glassmorphic navbar class
    content = content.replace(
        "bg-[#0A2025]/95 backdrop-blur-2xl border border-[rgba(0,201,216,0.35)] shadow-[0_20px_40px_rgba(0,0,0,0.6)]",
        "bg-[#0E141B] border border-[#1C2633] shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
    )
    content = content.replace(
        "bg-[#061519]/85 backdrop-blur-xl border border-[rgba(0,201,216,0.22)] shadow-[0_12px_32px_rgba(0,0,0,0.4)]",
        "bg-[#0C1116] border border-[#1A232E] shadow-[0_2px_16px_rgba(0,0,0,0.35)]"
    )

    # Remove the hairline gradient glow from navbar
    content = content.replace(
        '<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/35 to-transparent pointer-events-none rounded-t-2xl" />',
        ''
    )

    # Clean active link styles (solid Hallmark pill instead of blurry glow)
    content = content.replace(
        "'text-[#00C9D8] bg-[#00C9D8]/10 border-[#00C9D8]/30 shadow-[0_0_12px_rgba(0,201,216,0.15)] font-semibold'",
        "'text-[#00D5E5] bg-[#141C25] border-[#223142] font-semibold shadow-sm'"
    )
    content = content.replace(
        "'text-[#9BB2B7] border-transparent hover:text-[#F3F8F8] hover:bg-white/[0.04] hover:border-[rgba(0,201,216,0.15)]'",
        "'text-[#8899A6] border-transparent hover:text-[#F8FAFC] hover:bg-[#121820] hover:border-[#1C2633]'"
    )
    content = content.replace(
        'w-1.5 h-1.5 rounded-full bg-[#00C9D8] shadow-[0_0_8px_rgba(0,201,216,0.8)]',
        'w-1.5 h-1.5 rounded-full bg-[#00D5E5]'
    )

    # Clean search input
    content = content.replace(
        'className="bg-[#030B0D]/70 border border-[rgba(0,201,216,0.18)] rounded-xl py-1.5 pl-9 pr-12 text-sm text-[#F3F8F8] placeholder-[#6F8B91] focus:outline-none focus:border-[#00C9D8] w-48 transition-colors"',
        'className="bg-[#0A0E13] border border-[#1C2633] rounded-xl py-1.5 pl-9 pr-12 text-sm text-[#F8FAFC] placeholder-[#627282] focus:outline-none focus:border-[#00D5E5] focus:ring-1 focus:ring-[#00D5E5]/20 w-48 transition-all"'
    )

    # Clean action buttons
    content = content.replace(
        'className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#061416] rounded-xl transition-all shadow-[0_0_20px_rgba(0,201,216,0.25)] hover:shadow-[0_0_26px_rgba(0,201,216,0.4)] cursor-pointer"',
        'className="px-5 py-2 text-sm font-bold bg-[#00D5E5] hover:bg-[#25E0EE] text-[#040D10] rounded-xl transition-all shadow-sm hover:shadow-[0_2px_10px_rgba(0,213,229,0.25)] cursor-pointer"'
    )
    content = content.replace(
        'className="text-sm font-medium text-[#F3F8F8] hover:text-[#00C9D8] transition-colors cursor-pointer px-4 py-2 border border-[rgba(0,201,216,0.18)] rounded-xl hover:bg-[rgba(0,201,216,0.06)] hover:border-[#00C9D8]/40"',
        'className="text-sm font-medium text-[#CBD5E1] hover:text-[#F8FAFC] transition-colors cursor-pointer px-4 py-2 border border-[#1C2633] rounded-xl bg-[#10161D] hover:bg-[#141C25] hover:border-[#2B3B4E]"'
    )

    # Clean profile dropdown
    content = content.replace(
        'bg-[#0A2025]/98 backdrop-blur-2xl border border-[rgba(0,201,216,0.25)] rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.7)]',
        'bg-[#0E141B] border border-[#1F2C3C] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
    )
    content = content.replace(
        '<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/40 to-transparent pointer-events-none" />',
        ''
    )
    content = content.replace(
        'bg-[#061519]/80 border border-[rgba(0,201,216,0.12)]',
        'bg-[#0A0E13] border border-[#1A232E]'
    )

    # Mobile menu drawer
    content = content.replace(
        'bg-[#0A2025]/95 backdrop-blur-2xl border border-[rgba(0,201,216,0.25)] shadow-[0_20px_40px_rgba(0,0,0,0.6)]',
        'bg-[#0E141B] border border-[#1C2633] shadow-[0_20px_40px_rgba(0,0,0,0.6)]'
    )
    content = content.replace(
        '<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />',
        ''
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Refactored Navbar.tsx")

def refactor_dashboard_tsx():
    path = "frontend/src/pages/DashboardPage.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove floating blur orbs
    content = re.sub(
        r'\{\/\* Precision Background Glows \*\/\}\s*<div className="absolute top-\[-100px\].*?pointer-events-none -z-10" \/>\s*<div className="absolute bottom-\[-100px\].*?pointer-events-none -z-10" \/>',
        '',
        content
    )

    # Clean header border
    content = content.replace(
        'border-b border-[rgba(0,201,216,0.14)]',
        'border-b border-[#1C2633]'
    )

    # Clean header buttons
    content = content.replace(
        'p-2.5 rounded-xl bg-[#07171B] border border-[rgba(0,201,216,0.22)] text-[#9BB2B7] hover:text-[#00C9D8] hover:border-[#00C9D8]/50 transition-all cursor-pointer shadow-sm',
        'p-2.5 rounded-xl bg-[#10161D] border border-[#1C2633] text-[#8899A6] hover:text-[#00D5E5] hover:border-[#2B3B4E] transition-all cursor-pointer shadow-sm'
    )
    content = content.replace(
        'px-3.5 py-2 rounded-xl bg-[#07171B] border border-[rgba(0,201,216,0.22)] text-xs font-mono font-medium text-[#9BB2B7] hover:text-[#F3F8F8] hover:border-[#00C9D8]/45 transition-all flex items-center gap-2 cursor-pointer shadow-sm',
        'px-3.5 py-2 rounded-xl bg-[#10161D] border border-[#1C2633] text-xs font-mono font-medium text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#2B3B4E] transition-all flex items-center gap-2 cursor-pointer shadow-sm'
    )
    content = content.replace(
        'px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#030B0D] font-bold text-xs flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-[0_0_24px_rgba(0,201,216,0.28)]',
        'px-4 py-2 rounded-xl bg-[#00D5E5] hover:bg-[#25E0EE] text-[#040D10] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm'
    )

    # Metric card styles (solid Hallmark cards)
    content = content.replace(
        'bg-[#091D22]/85 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)] relative overflow-hidden group hover:border-[#00C9D8]/40 transition-all',
        'bg-[#10161D] border border-[#1C2633] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-[#2B3B4E] transition-all'
    )
    content = content.replace(
        'bg-[#091D22]/85 backdrop-blur-xl border border-[#00C9D8]/35 rounded-2xl p-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)] relative overflow-hidden group hover:border-[#00C9D8]/60 transition-all',
        'bg-[#10161D] border border-[#203042] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-[#2E4560] transition-all'
    )

    # Remove hairline gradients
    content = content.replace(
        '<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/30 to-transparent" />',
        ''
    )
    content = content.replace(
        '<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9D8]/60 to-transparent" />',
        ''
    )

    # Spec Strip
    content = content.replace(
        'bg-[#07161A]/90 border border-[rgba(0,201,216,0.16)] rounded-2xl p-4 sm:p-5 shadow-lg',
        'bg-[#0C1218] border border-[#1C2633] rounded-2xl p-4 sm:p-5 shadow-sm'
    )
    content = content.replace(
        'px-3 py-1.5 rounded-lg bg-[#030A0C] border border-[rgba(0,201,216,0.15)] flex items-center gap-2',
        'px-3 py-1.5 rounded-lg bg-[#0A0E13] border border-[#1C2633] flex items-center gap-2'
    )

    # Chart & History column panels
    content = content.replace(
        'lg:col-span-5 bg-[#091D22]/85 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.35)] flex flex-col justify-between relative overflow-hidden',
        'lg:col-span-5 bg-[#10161D] rounded-2xl border border-[#1C2633] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.3)] flex flex-col justify-between relative overflow-hidden'
    )
    content = content.replace(
        'lg:col-span-7 bg-[#091D22]/85 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.35)] flex flex-col relative overflow-hidden',
        'lg:col-span-7 bg-[#10161D] rounded-2xl border border-[#1C2633] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.3)] flex flex-col relative overflow-hidden'
    )

    # Dividers
    content = content.replace('border-[rgba(0,201,216,0.12)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.08)]', 'border-[#18212C]')

    # Recent activity item rows
    content = content.replace(
        'p-3.5 rounded-xl bg-[#061418] hover:bg-[#091E23] border border-[rgba(0,201,216,0.16)] hover:border-[#00C9D8]/40 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-sm',
        'p-3.5 rounded-xl bg-[#0B0F14] hover:bg-[#131A23] border border-[#18222E] hover:border-[#233142] transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-sm'
    )

    # Empty feed state
    content = content.replace(
        'bg-[#051114]/70 border border-[rgba(0,201,216,0.12)]',
        'bg-[#0A0E13] border border-[#1C2633]'
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Refactored DashboardPage.tsx")

def refactor_analyzer_tsx():
    path = "frontend/src/pages/AnalyzerPage.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove floating blur orbs
    content = re.sub(
        r'<div className="absolute top-\[-10%\].*?pointer-events-none -z-10" \/>\s*<div className="absolute bottom-\[-10%\].*?pointer-events-none -z-10" \/>',
        '',
        content
    )

    # Solid card replacements
    content = content.replace(
        'bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] flex flex-col h-full overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)] relative',
        'bg-[#10161D] rounded-2xl border border-[#1C2633] flex flex-col h-full overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.35)] relative'
    )
    content = content.replace(
        'bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.4)] relative overflow-hidden',
        'bg-[#10161D] rounded-2xl border border-[#1C2633] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.35)] relative overflow-hidden'
    )
    content = content.replace(
        'bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.4)] relative overflow-hidden',
        'bg-[#10161D] rounded-2xl border border-[#1C2633] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.35)] relative overflow-hidden'
    )

    # Sub-panels and wells
    content = content.replace('bg-[#061519]/70', 'bg-[#0C1116]')
    content = content.replace('bg-[#030B0D]/80', 'bg-[#0A0E13]')
    content = content.replace('bg-[#030B0D]/90', 'bg-[#0A0E13]')
    content = content.replace('bg-[#061519]/90', 'bg-[#0B0F14]')
    content = content.replace('bg-[#0A2023]/60', 'bg-[#121922]')
    content = content.replace('bg-[#061519]/40', 'bg-[#0A0E13]')
    content = content.replace('border-[rgba(0,201,216,0.18)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.15)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.12)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.2)]', 'border-[#202E3E]')
    content = content.replace('border-[rgba(0,201,216,0.25)]', 'border-[#223142]')

    # Primary Analyze button
    content = content.replace(
        'bg-gradient-to-r from-[#00C9D8] to-[#008FA3] hover:brightness-110 text-[#061416] font-bold text-xs sm:text-sm font-mono uppercase tracking-widest rounded-xl flex items-center gap-2.5 transition-all disabled:opacity-50 disabled:hover:brightness-100 cursor-pointer shadow-[0_0_24px_rgba(0,201,216,0.25)]',
        'bg-[#00D5E5] hover:bg-[#25E0EE] text-[#040D10] font-bold text-xs sm:text-sm font-mono uppercase tracking-widest rounded-xl flex items-center gap-2.5 transition-all disabled:opacity-50 disabled:hover:bg-[#00D5E5] cursor-pointer shadow-sm'
    )
    content = content.replace(
        'bg-gradient-to-r from-[#00C9D8] to-[#008FA3] text-[#061416] font-bold shadow-[0_0_12px_rgba(0,201,216,0.25)]',
        'bg-[#00D5E5] text-[#040D10] font-bold shadow-sm'
    )

    # Thinking overlay modal
    content = content.replace(
        'bg-[#061416]/80 backdrop-blur-md',
        'bg-[#06090C]/85'
    )
    content = content.replace(
        'bg-[#0A2023] p-8 rounded-2xl border border-[rgba(0,201,216,0.25)]',
        'bg-[#10161D] p-8 rounded-2xl border border-[#223142] shadow-2xl'
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Refactored AnalyzerPage.tsx")

def refactor_history_tsx():
    path = "frontend/src/pages/HistoryPage.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove floating blur orbs
    content = re.sub(
        r'<div className="absolute top-\[-10%\].*?pointer-events-none -z-10" \/>\s*<div className="absolute top-\[20%\].*?pointer-events-none -z-10" \/>',
        '',
        content
    )

    # Replace glass table container
    content = content.replace(
        'bg-[#0A2023]/80 backdrop-blur-xl rounded-2xl border border-[rgba(0,201,216,0.18)] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)] flex flex-col flex-1 min-h-[500px] relative',
        'bg-[#10161D] rounded-2xl border border-[#1C2633] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.35)] flex flex-col flex-1 min-h-[500px] relative'
    )

    # Table header
    content = content.replace(
        'bg-[#030B0D]/50 text-xs font-mono font-bold text-[#9BB2B7] uppercase tracking-[0.2em]',
        'bg-[#0C1116] text-xs font-mono font-bold text-[#8899A6] uppercase tracking-[0.15em]'
    )

    # Table rows
    content = content.replace(
        'hover:bg-[#00C9D8]/[0.03] transition-colors',
        'hover:bg-[#141C25] transition-colors'
    )
    content = content.replace('border-[rgba(0,201,216,0.12)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.2)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.18)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.15)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.22)]', 'border-[#223142]')
    content = content.replace('bg-[#030B0D]/80', 'bg-[#0A0E13]')
    content = content.replace('bg-[#030B0D]/90', 'bg-[#0A0E13]')
    content = content.replace('bg-[#030B0D]', 'bg-[#0A0E13]')
    content = content.replace('bg-[#0A2023]', 'bg-[#10161D]')
    content = content.replace('bg-[#061416]/90 backdrop-blur-md', 'bg-[#06090C]/85')

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Refactored HistoryPage.tsx")

def refactor_compare_tsx():
    path = "frontend/src/pages/ComparePage.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove floating blur orbs
    content = re.sub(
        r'<div className="absolute top-\[-10%\].*?pointer-events-none -z-10" \/>\s*<div className="absolute bottom-\[-10%\].*?pointer-events-none -z-10" \/>',
        '',
        content
    )

    # Replace glass cards
    content = content.replace(
        'bg-[#0A2023]/80 backdrop-blur-xl border border-[rgba(0,201,216,0.18)] rounded-2xl p-4 flex flex-col justify-between shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:border-[#00C9D8]/40 transition-all relative overflow-hidden group',
        'bg-[#10161D] border border-[#1C2633] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-[#2B3B4E] transition-all relative overflow-hidden group'
    )
    content = content.replace(
        'bg-[#0A2023]/80 backdrop-blur-xl border border-[#00C9D8]/30 rounded-2xl p-4 flex flex-col justify-between shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:border-[#00C9D8]/50 transition-all relative overflow-hidden group',
        'bg-[#10161D] border border-[#203042] rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-[#2E4560] transition-all relative overflow-hidden group'
    )
    content = content.replace('bg-[#030B0D]/80', 'bg-[#0A0E13]')
    content = content.replace('bg-[#0A2023]', 'bg-[#10161D]')
    content = content.replace('bg-[#061416]/80 backdrop-blur-md', 'bg-[#06090C]/85')
    content = content.replace('border-[rgba(0,201,216,0.15)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.18)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.25)]', 'border-[#223142]')

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Refactored ComparePage.tsx")

def refactor_paraphrase_tsx():
    path = "frontend/src/pages/ParaphrasePage.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove floating blur orbs
    content = re.sub(
        r'<div className="absolute top-\[-10%\].*?pointer-events-none -z-10" \/>\s*<div className="absolute bottom-\[-10%\].*?pointer-events-none -z-10" \/>',
        '',
        content
    )

    content = content.replace('bg-[#030B0D]/80', 'bg-[#0A0E13]')
    content = content.replace('bg-[#0A2023]/80 backdrop-blur-xl', 'bg-[#10161D]')
    content = content.replace('bg-[#0A2023]', 'bg-[#10161D]')
    content = content.replace('border-[rgba(0,201,216,0.2)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.18)]', 'border-[#1C2633]')
    content = content.replace('border-[rgba(0,201,216,0.25)]', 'border-[#223142]')

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Refactored ParaphrasePage.tsx")

if __name__ == "__main__":
    refactor_app_tsx()
    refactor_navbar_tsx()
    refactor_dashboard_tsx()
    refactor_analyzer_tsx()
    refactor_history_tsx()
    refactor_compare_tsx()
    refactor_paraphrase_tsx()
    print("ALL HALLMARK REFACTORINGS COMPLETE!")
