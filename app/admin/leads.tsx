'use client';
import {useState} from 'react';
import {useReactTable,getCoreRowModel,getFilteredRowModel,getSortedRowModel,flexRender,type ColumnDef,type SortingState} from '@tanstack/react-table';
import {canQualify} from '@/lib/leads';
type Lead={inquiry_id:string;vehicle_id:string|null;source:string;question:string;created_at:string;contact_method:string|null;contact_value:string|null;consent:number;is_test:number;lead_status:string};
const columns:ColumnDef<Lead>[]=[
 {accessorKey:'created_at',header:'Received'},
 {accessorKey:'inquiry_id',header:'Reference'},
 {accessorKey:'vehicle_id',header:'Vehicle'},
 {accessorKey:'source',header:'Source label'},
 {accessorKey:'question',header:'Question'},
 {accessorKey:'contact_value',header:'Contact'},
 {accessorKey:'lead_status',header:'Status'},
 {id:'test',accessorFn:r=>r.is_test?'TEST':'Customer',header:'Record type'},
 {id:'actions',header:'Follow up',enableSorting:false,cell:({row})=>{const lead=row.original;return <form action="/api/admin/lead" method="post"><input type="hidden" name="inquiry_id" value={lead.inquiry_id}/><select name="status" defaultValue={lead.lead_status} aria-label={'Status for inquiry '+lead.inquiry_id}><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified" disabled={!canQualify(lead)}>Qualified buyer</option><option value="closed">Closed</option><option value="spam">Spam</option></select><button type="submit">Save status</button><button type="submit" name="action" value="delete" onClick={e=>{if(!confirm('Permanently delete this inquiry?'))e.preventDefault();}}>Delete</button></form>;}}
];
export default function LeadTable({rows}:{rows:Lead[]}){
 const [sorting,setSorting]=useState<SortingState>([]);const[filter,setFilter]=useState('');
 const table=useReactTable({data:rows,columns,state:{sorting,globalFilter:filter},onSortingChange:setSorting,onGlobalFilterChange:setFilter,getCoreRowModel:getCoreRowModel(),getFilteredRowModel:getFilteredRowModel(),getSortedRowModel:getSortedRowModel()});
 return <><label>Find inquiries<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search question, vehicle, source or contact"/></label><p>{table.getRowModel().rows.length} of {rows.length} recent inquiries. Click column headings to sort.</p><div className="table-wrap"><table><thead>{table.getHeaderGroups().map(g=><tr key={g.id}>{g.headers.map(h=><th key={h.id}>{h.column.getCanSort()?<button type="button" onClick={h.column.getToggleSortingHandler()}>{flexRender(h.column.columnDef.header,h.getContext())}{h.column.getIsSorted()==='asc'?' ↑':h.column.getIsSorted()==='desc'?' ↓':''}</button>:flexRender(h.column.columnDef.header,h.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map(r=><tr key={r.id}>{r.getVisibleCells().map(c=><td key={c.id}>{flexRender(c.column.columnDef.cell,c.getContext())}</td>)}</tr>)}</tbody></table></div></>;
}
