package www.java.client.model;

import java.util.List;

public class PaginatedResponse<T> {
    private Metadata metadata;
    private List<T> result;

    public PaginatedResponse() {}

    public PaginatedResponse(Metadata metadata, List<T> result) {
        this.metadata = metadata;
        this.result = result;
    }

    public Metadata getMetadata() { return metadata; }
    public void setMetadata(Metadata metadata) { this.metadata = metadata; }

    public List<T> getResult() { return result; }
    public void setResult(List<T> result) { this.result = result; }

    public static class Metadata {
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean first;
        private boolean last;
        private boolean empty;
        private String sortField;
        private String sortDirection;
        private long numberOfElements;

        public Metadata() {}

        public int getPage() { return page; }
        public void setPage(int page) { this.page = page; }

        public int getSize() { return size; }
        public void setSize(int size) { this.size = size; }

        public long getTotalElements() { return totalElements; }
        public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

        public int getTotalPages() { return totalPages; }
        public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

        public boolean isFirst() { return first; }
        public void setFirst(boolean first) { this.first = first; }

        public boolean isLast() { return last; }
        public void setLast(boolean last) { this.last = last; }

        public boolean isEmpty() { return empty; }
        public void setIsEmpty(boolean empty) { this.empty = empty; }

        public String getSortField() { return sortField; }
        public void setSortField(String sortField) { this.sortField = sortField; }

        public String getSortDirection() { return sortDirection; }
        public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }

        public long getNumberOfElements() { return numberOfElements; }
        public void setNumberOfElements(long numberOfElements) { this.numberOfElements = numberOfElements; }
    }
}
