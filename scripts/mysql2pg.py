#!/usr/bin/env python3
"""MySQL dump → PostgreSQL 변환 스크립트 (대용량 지원)"""

import re
import os

DUMP_PATH = os.path.join(os.path.dirname(__file__), '..', 'alllovechurch-20260308.dump')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'migrations')
SCHEMA_OUT = os.path.join(OUT_DIR, '100_cafe24_schema.sql')
DATA_OUT = os.path.join(OUT_DIR, '101_cafe24_data.sql')

PREFIX = 'qqqq_'


def convert_type(mysql_type):
    t = mysql_type.strip().lower()
    if re.match(r'bigint\(\d+\)', t): return 'bigint'
    if re.match(r'int\(\d+\)\s+unsigned', t): return 'bigint'
    if re.match(r'int\(\d+\)', t): return 'integer'
    if re.match(r'mediumint\(\d+\)', t): return 'integer'
    if re.match(r'smallint\(\d+\)', t): return 'smallint'
    if re.match(r'tinyint\(\d+\)', t): return 'smallint'
    m = re.match(r'decimal\((\d+),(\d+)\)', t)
    if m: return f'numeric({m.group(1)},{m.group(2)})'
    if t.startswith('float'): return 'real'
    if t.startswith('double'): return 'double precision'
    m = re.match(r'varchar\((\d+)\)', t)
    if m: return f'varchar({m.group(1)})'
    if t.startswith('char('):
        m2 = re.match(r'char\((\d+)\)', t)
        return f'char({m2.group(1)})' if m2 else 'char(1)'
    if t in ('longtext', 'mediumtext', 'text', 'tinytext'): return 'text'
    if t in ('longblob', 'mediumblob', 'blob', 'tinyblob'): return 'bytea'
    if t == 'datetime': return 'timestamp'
    if t == 'date': return 'date'
    if t == 'time': return 'time'
    if t == 'timestamp': return 'timestamp'
    if t in ('year(4)', 'year'): return 'smallint'
    if t.startswith('enum('): return 'text'
    if t.startswith('set('): return 'text'
    return t


def parse_create_table(block):
    m = re.match(r'CREATE TABLE `(\w+)`', block)
    if not m:
        return None, None
    table_name = m.group(1)
    inner = re.search(r'\((.*)\)\s*(ENGINE|TYPE)', block, re.DOTALL)
    if not inner:
        return None, None

    body = inner.group(1)
    lines = []
    pkey = None

    for raw_line in body.split('\n'):
        line = raw_line.strip().rstrip(',')
        if not line:
            continue
        pk_m = re.match(r'PRIMARY KEY\s*\((.+)\)', line, re.IGNORECASE)
        if pk_m:
            cols = pk_m.group(1).replace('`', '"')
            pkey = f'  PRIMARY KEY ({cols})'
            continue
        if re.match(r'(UNIQUE\s+)?KEY\s+`', line, re.IGNORECASE): continue
        if re.match(r'(INDEX|FULLTEXT|SPATIAL)', line, re.IGNORECASE): continue
        if re.match(r'CONSTRAINT', line, re.IGNORECASE): continue

        col_m = re.match(r'`(\w+)`\s+(.+)', line)
        if not col_m: continue
        col_name = col_m.group(1)
        rest = col_m.group(2)
        type_m = re.match(r'(\w+(?:\([^)]*\))?(?:\s+unsigned)?)', rest, re.IGNORECASE)
        if not type_m: continue
        mysql_type = type_m.group(1)
        pg_type = convert_type(mysql_type)
        remainder = rest[type_m.end():].strip()
        parts = [f'  "{col_name}" {pg_type}']
        if 'NOT NULL' in remainder.upper():
            parts.append('NOT NULL')
        def_m = re.search(r"DEFAULT\s+('(?:[^'\\]|\\.)*'|[^\s,]+)", remainder, re.IGNORECASE)
        if def_m:
            default_val = def_m.group(1)
            if default_val.upper() == 'CURRENT_TIMESTAMP':
                parts.append('DEFAULT now()')
            elif default_val.upper() == 'NULL':
                parts.append('DEFAULT NULL')
            else:
                parts.append(f'DEFAULT {default_val}')
        if 'AUTO_INCREMENT' in remainder.upper():
            parts = [f'  "{col_name}" {"bigserial" if pg_type == "bigint" else "serial"}']
        lines.append(' '.join(parts))

    if pkey:
        lines.append(pkey)
    if not lines:
        return None, None

    ddl = f'CREATE TABLE IF NOT EXISTS cafe24."{PREFIX}{table_name}" (\n'
    ddl += ',\n'.join(lines)
    ddl += '\n);\n'
    return table_name, ddl


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # 줄 단위로 읽으면서 CREATE TABLE 블록과 INSERT 라인을 분리
    create_blocks = []
    current_block = None

    schema_tables = 0
    data_inserts = 0

    # 1단계: 스키마 추출 (CREATE TABLE은 여러 줄)
    with open(DUMP_PATH, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            if line.startswith('CREATE TABLE'):
                current_block = line
            elif current_block is not None:
                current_block += line
                if re.search(r'\)\s*(ENGINE|TYPE)=', line):
                    create_blocks.append(current_block)
                    current_block = None

    # 스키마 파일 작성
    with open(SCHEMA_OUT, 'w', encoding='utf-8') as f:
        f.write('-- 카페24 MySQL → Supabase PostgreSQL 스키마 마이그레이션\n')
        f.write('-- 자동 생성됨\n\n')
        f.write('CREATE SCHEMA IF NOT EXISTS cafe24;\n\n')
        for block in create_blocks:
            table_name, ddl = parse_create_table(block)
            if ddl:
                f.write(f'-- {table_name}\n')
                f.write(ddl)
                f.write('\n')
                schema_tables += 1

    print(f'스키마: {schema_tables}개 테이블 → {SCHEMA_OUT}')

    # 2단계: 데이터 추출 (INSERT는 한 줄이지만 매우 길 수 있음)
    with open(DUMP_PATH, 'r', encoding='utf-8', errors='replace') as fin, \
         open(DATA_OUT, 'w', encoding='utf-8') as fout:

        fout.write('-- 카페24 MySQL → Supabase PostgreSQL 데이터 마이그레이션\n')
        fout.write('-- 자동 생성됨\n\n')
        fout.write('SET session_replication_role = replica;\n\n')

        for line in fin:
            if line.startswith('INSERT INTO `'):
                # 테이블명 치환
                converted = re.sub(
                    r'INSERT INTO `(\w+)`',
                    lambda m: f'INSERT INTO cafe24."{PREFIX}{m.group(1)}"',
                    line,
                    count=1
                )
                # MySQL 이스케이프 처리
                # \' → '' (PostgreSQL 스타일)은 복잡하므로 standard_conforming_strings 유지
                fout.write(converted)
                data_inserts += 1

        fout.write('\nSET session_replication_role = DEFAULT;\n')

    print(f'데이터: {data_inserts}개 INSERT → {DATA_OUT}')

    # 크기 확인
    schema_size = os.path.getsize(SCHEMA_OUT)
    data_size = os.path.getsize(DATA_OUT)
    print(f'스키마 파일: {schema_size / 1024:.0f}KB')
    print(f'데이터 파일: {data_size / 1024 / 1024:.1f}MB')


if __name__ == '__main__':
    main()
